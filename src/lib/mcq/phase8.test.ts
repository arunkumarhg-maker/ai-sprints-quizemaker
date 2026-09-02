import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/lib/auth/session";
import {
	createMockD1Database,
	getMockMcqAttemptCount,
} from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";
import { getDb } from "@/lib/db";
import { recordAttempt } from "@/lib/mcq/attempts";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { createMcq, deleteMcq } from "@/lib/mcq/mcqs";
import type { CreateMcqInput } from "@/lib/mcq/types";
import { POST as recordAttemptRoute } from "@/app/api/mcqs/[id]/attempts/route";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
	getCurrentSession: vi.fn(),
}));

const TEST_USER = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
};

const VALID_MCQ: CreateMcqInput = {
	name: "Capital Cities",
	question: "What is the capital of France?",
	choices: [
		{ choiceText: "Paris", isCorrect: true },
		{ choiceText: "London", isCorrect: false },
	],
};

function routeParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

function attemptRequest(selectedChoiceId: string): Request {
	return new Request("http://localhost/api/mcqs/mcq-id/attempts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ selectedChoiceId }),
	});
}

async function listAttemptsForMcq(db: D1Database, mcqId: string) {
	const { results } = await db
		.prepare(
			`SELECT id, mcq_id, user_id, selected_choice_id, is_correct, created_at
       FROM mcq_attempts
       WHERE mcq_id = ?1`,
		)
		.bind(mcqId)
		.all<{
			id: string;
			mcq_id: string;
			user_id: string;
			selected_choice_id: string;
			is_correct: number;
			created_at: string;
		}>();

	return results;
}

describe("Phase 8 MCQ attempts hardening (TC-M8-01 – TC-M8-06)", () => {
	let db: D1Database;
	let userId: string;
	let ownerUser: {
		id: string;
		fullName: string;
		email: string;
		passwordHash: string;
		createdAt: string;
	};

	beforeEach(async () => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		vi.mocked(getCurrentSession).mockResolvedValue({ authenticated: false });

		const result = await createUser(db, TEST_USER);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("Failed to seed user");
		}
		userId = result.user.id;
		ownerUser = result.user;
	});

	async function authenticateAsOwner() {
		vi.mocked(getCurrentSession).mockResolvedValue({
			authenticated: true,
			userId,
			user: ownerUser,
			session: {
				id: crypto.randomUUID(),
				userId,
				expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				createdAt: new Date().toISOString(),
			},
		});
	}

	it("TC-M8-01: attempt row created in DB on preview submit", async () => {
		await authenticateAsOwner();
		const created = await createMcq(db, userId, VALID_MCQ);
		const correctChoiceId = created.choices.find((choice) => choice.isCorrect)?.id;
		expect(correctChoiceId).toBeTruthy();
		if (!correctChoiceId) return;

		expect(getMockMcqAttemptCount(db, created.id)).toBe(0);

		const response = await recordAttemptRoute(
			attemptRequest(correctChoiceId),
			routeParams(created.id),
		);

		expect(response.status).toBe(201);
		expect(getMockMcqAttemptCount(db, created.id)).toBe(1);

		const attempts = await listAttemptsForMcq(db, created.id);
		expect(attempts).toHaveLength(1);
		expect(attempts[0]?.user_id).toBe(userId);
		expect(attempts[0]?.selected_choice_id).toBe(correctChoiceId);
	});

	it("TC-M8-02: is_correct computed correctly in DB", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const wrongChoiceId = created.choices.find((choice) => !choice.isCorrect)?.id;
		expect(wrongChoiceId).toBeTruthy();
		if (!wrongChoiceId) return;

		await recordAttempt(db, created.id, userId, wrongChoiceId);

		const attempts = await listAttemptsForMcq(db, created.id);
		expect(attempts).toHaveLength(1);
		expect(attempts[0]?.is_correct).toBe(0);
		expect(attempts[0]?.selected_choice_id).toBe(wrongChoiceId);
	});

	it("TC-M8-03: multiple attempts allowed per user per MCQ", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const [correctChoiceId, wrongChoiceId] = [
			created.choices.find((choice) => choice.isCorrect)?.id,
			created.choices.find((choice) => !choice.isCorrect)?.id,
		];
		expect(correctChoiceId).toBeTruthy();
		expect(wrongChoiceId).toBeTruthy();
		if (!correctChoiceId || !wrongChoiceId) return;

		await recordAttempt(db, created.id, userId, correctChoiceId);
		await recordAttempt(db, created.id, userId, wrongChoiceId);

		expect(getMockMcqAttemptCount(db, created.id)).toBe(2);
		const attempts = await listAttemptsForMcq(db, created.id);
		expect(attempts).toHaveLength(2);
	});

	it("TC-M8-04: attempt without auth returns 401", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const choiceId = created.choices[0]?.id;
		expect(choiceId).toBeTruthy();
		if (!choiceId) return;

		const response = await recordAttemptRoute(
			attemptRequest(choiceId),
			routeParams(created.id),
		);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toBe("Unauthorized");
		expect(getMockMcqAttemptCount(db, created.id)).toBe(0);
	});

	it("TC-M8-05: attempt with choice from wrong MCQ returns 400", async () => {
		await authenticateAsOwner();
		const firstMcq = await createMcq(db, userId, VALID_MCQ);
		const secondMcq = await createMcq(db, userId, {
			...VALID_MCQ,
			name: "Second Question",
		});
		const foreignChoiceId = secondMcq.choices[0]?.id;
		expect(foreignChoiceId).toBeTruthy();
		if (!foreignChoiceId) return;

		const response = await recordAttemptRoute(
			attemptRequest(foreignChoiceId),
			routeParams(firstMcq.id),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe(MCQ_MESSAGES.invalidSelectedChoice);
		expect(getMockMcqAttemptCount(db, firstMcq.id)).toBe(0);
	});

	it("TC-M8-06: attempts deleted when MCQ deleted", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const choiceId = created.choices[0]?.id;
		expect(choiceId).toBeTruthy();
		if (!choiceId) return;

		await recordAttempt(db, created.id, userId, choiceId);
		await recordAttempt(db, created.id, userId, choiceId);
		expect(getMockMcqAttemptCount(db, created.id)).toBe(2);

		const deleted = await deleteMcq(db, created.id, userId);
		expect(deleted).toBe(true);
		expect(getMockMcqAttemptCount(db, created.id)).toBe(0);
	});
});
