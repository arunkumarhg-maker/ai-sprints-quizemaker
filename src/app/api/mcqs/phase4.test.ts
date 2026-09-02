import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentSession } from "@/lib/auth/session";
import { createMockD1Database } from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";
import { getDb } from "@/lib/db";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { createMcq } from "@/lib/mcq/mcqs";
import type {
	CreateMcqInput,
	McqAttempt,
	McqListItem,
	McqWithChoices,
	PreviewMcq,
} from "@/lib/mcq/types";
import { GET as listMcqs, POST as createMcqRoute } from "@/app/api/mcqs/route";
import {
	DELETE as deleteMcqRoute,
	GET as getMcqRoute,
	PUT as updateMcqRoute,
} from "@/app/api/mcqs/[id]/route";
import { GET as previewMcqRoute, POST as previewPostRoute } from "@/app/api/mcqs/[id]/preview/route";
import { POST as recordAttemptRoute } from "@/app/api/mcqs/[id]/attempts/route";

type ApiErrorResponseBody = { error: string };
type ValidationErrorResponseBody = { errors?: Record<string, string | undefined> };
type McqListResponseBody = { mcqs: McqListItem[] };
type McqResponseBody = { mcq: McqWithChoices };
type DeleteResponseBody = { success: boolean };
type PreviewResponseBody = { preview: PreviewMcq };
type AttemptResponseBody = { attempt: McqAttempt; isCorrect: boolean };

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

const OTHER_USER = {
	fullName: "John Smith",
	email: "john@example.com",
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

function jsonRequest(
	method: string,
	body?: unknown,
): Request {
	return new Request("http://localhost/api/mcqs", {
		method,
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

async function authenticateAs(
	user: { id: string; fullName: string; email: string; passwordHash: string; createdAt: string },
) {
	vi.mocked(getCurrentSession).mockResolvedValue({
		authenticated: true,
		userId: user.id,
		user,
		session: {
			id: crypto.randomUUID(),
			userId: user.id,
			expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
			createdAt: new Date().toISOString(),
		},
	});
}

describe("Phase 4 MCQ API routes (TC-M4-01 – TC-M4-14)", () => {
	let db: D1Database;
	let userId: string;
	let otherUserId: string;
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

		const other = await createUser(db, OTHER_USER);
		expect(other.ok).toBe(true);
		if (!other.ok) {
			throw new Error("Failed to seed other user");
		}
		otherUserId = other.user.id;
	});

	it("TC-M4-01: GET /api/mcqs without session returns 401", async () => {
		const response = await listMcqs();
		expect(response.status).toBe(401);
		const body = (await response.json()) as ApiErrorResponseBody;
		expect(body.error).toBe("Unauthorized");
	});

	it("TC-M4-02: GET /api/mcqs with session returns user's MCQs", async () => {
		await authenticateAs(ownerUser);
		await createMcq(db, userId, VALID_MCQ);
		await createMcq(db, otherUserId, {
			...VALID_MCQ,
			name: "Other MCQ",
		});

		const response = await listMcqs();
		expect(response.status).toBe(200);
		const body = (await response.json()) as McqListResponseBody;
		expect(body.mcqs).toHaveLength(1);
		expect(body.mcqs[0].name).toBe(VALID_MCQ.name);
	});

	it("TC-M4-03: POST /api/mcqs creates MCQ", async () => {
		await authenticateAs(ownerUser);
		const response = await createMcqRoute(jsonRequest("POST", VALID_MCQ));
		expect(response.status).toBe(201);
		const body = (await response.json()) as McqResponseBody;
		expect(body.mcq.name).toBe(VALID_MCQ.name);
		expect(body.mcq.choices).toHaveLength(2);
	});

	it("TC-M4-04: POST /api/mcqs invalid body returns 400", async () => {
		await authenticateAs(ownerUser);
		const response = await createMcqRoute(
			jsonRequest("POST", { ...VALID_MCQ, name: "   " }),
		);
		expect(response.status).toBe(400);
		const body = (await response.json()) as ValidationErrorResponseBody;
		expect(body.errors?.name).toBe(MCQ_MESSAGES.nameRequired);
	});

	it("TC-M4-05: GET /api/mcqs/[id] returns MCQ for owner", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = await getMcqRoute(
			new Request(`http://localhost/api/mcqs/${created.id}`),
			routeParams(created.id),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as McqResponseBody;
		expect(body.mcq.id).toBe(created.id);
	});

	it("TC-M4-06: GET /api/mcqs/[id] returns 404 for non-owner", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		vi.mocked(getCurrentSession).mockResolvedValue({
			authenticated: true,
			userId: otherUserId,
			user: {
				id: otherUserId,
				fullName: OTHER_USER.fullName,
				email: OTHER_USER.email,
				passwordHash: "hash",
				createdAt: new Date().toISOString(),
			},
			session: {
				id: crypto.randomUUID(),
				userId: otherUserId,
				expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				createdAt: new Date().toISOString(),
			},
		});

		const response = await getMcqRoute(
			new Request(`http://localhost/api/mcqs/${created.id}`),
			routeParams(created.id),
		);
		expect(response.status).toBe(404);
	});

	it("TC-M4-07: PUT /api/mcqs/[id] updates for owner", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = await updateMcqRoute(
			jsonRequest("PUT", {
				...VALID_MCQ,
				name: "Updated Name",
			}),
			routeParams(created.id),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as McqResponseBody;
		expect(body.mcq.name).toBe("Updated Name");
	});

	it("TC-M4-08: DELETE /api/mcqs/[id] deletes for owner", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = await deleteMcqRoute(
			new Request(`http://localhost/api/mcqs/${created.id}`, {
				method: "DELETE",
			}),
			routeParams(created.id),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as DeleteResponseBody;
		expect(body.success).toBe(true);
	});

	it("TC-M4-09: DELETE /api/mcqs/[id] 404 for non-owner", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		vi.mocked(getCurrentSession).mockResolvedValue({
			authenticated: true,
			userId: otherUserId,
			user: {
				id: otherUserId,
				fullName: OTHER_USER.fullName,
				email: OTHER_USER.email,
				passwordHash: "hash",
				createdAt: new Date().toISOString(),
			},
			session: {
				id: crypto.randomUUID(),
				userId: otherUserId,
				expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				createdAt: new Date().toISOString(),
			},
		});

		const response = await deleteMcqRoute(
			new Request(`http://localhost/api/mcqs/${created.id}`, {
				method: "DELETE",
			}),
			routeParams(created.id),
		);
		expect(response.status).toBe(404);
	});

	it("TC-M4-10: GET preview omits correct flags", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = await previewMcqRoute(
			new Request(`http://localhost/api/mcqs/${created.id}/preview`),
			routeParams(created.id),
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as PreviewResponseBody;
		expect(body.preview.choices).toHaveLength(2);
		for (const choice of body.preview.choices) {
			expect(choice).not.toHaveProperty("isCorrect");
		}
	});

	it("TC-M4-11: POST attempt returns isCorrect", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const correctChoiceId = created.choices.find((choice) => choice.isCorrect)?.id;
		expect(correctChoiceId).toBeTruthy();
		if (!correctChoiceId) return;

		const response = await recordAttemptRoute(
			jsonRequest("POST", { selectedChoiceId: correctChoiceId }),
			routeParams(created.id),
		);
		expect(response.status).toBe(201);
		const body = (await response.json()) as AttemptResponseBody;
		expect(body.isCorrect).toBe(true);
		expect(body.attempt.isCorrect).toBe(true);
	});

	it("TC-M4-12: POST attempt invalid choice 400", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = await recordAttemptRoute(
			jsonRequest("POST", { selectedChoiceId: crypto.randomUUID() }),
			routeParams(created.id),
		);
		expect(response.status).toBe(400);
		const body = (await response.json()) as ApiErrorResponseBody;
		expect(body.error).toBe(MCQ_MESSAGES.invalidSelectedChoice);
	});

	it("TC-M4-13: all routes return JSON errors, not stack traces", async () => {
		await authenticateAs(ownerUser);
		vi.mocked(getDb).mockRejectedValueOnce(new Error("database exploded"));

		const response = await listMcqs();
		expect(response.status).toBe(500);
		const body = (await response.json()) as ApiErrorResponseBody;
		expect(body.error).toBe(MCQ_MESSAGES.somethingWentWrong);
		expect(JSON.stringify(body)).not.toContain("database exploded");
		expect(JSON.stringify(body)).not.toContain("stack");
	});

	it("TC-M4-14: wrong HTTP method returns 405 where applicable", async () => {
		await authenticateAs(ownerUser);
		const created = await createMcq(db, userId, VALID_MCQ);
		const response = previewPostRoute();
		expect(response.status).toBe(405);
		expect(created.id).toBeTruthy();
	});
});
