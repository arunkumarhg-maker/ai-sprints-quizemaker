import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import {
	createMockD1Database,
	getMockMcqChoiceCount,
} from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";
import {
	MCQ_CHOICE_TEXT_MAX_LENGTH,
	MCQ_MAX_CHOICES,
	MCQ_MIN_CHOICES,
	MCQ_NAME_MAX_LENGTH,
	MCQ_QUESTION_MAX_LENGTH,
} from "@/lib/mcq/config";

const TEST_USER = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
};

const MIGRATION_PATH = join(
	process.cwd(),
	"migrations/0002_create_mcq_tables.sql",
);

type McqRow = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

type McqAttemptRow = {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: number;
	created_at: string;
};

async function insertMcq(
	db: D1Database,
	input: {
		id: string;
		name: string;
		question: string;
		createdByUserId: string;
		createdAt?: string;
		updatedAt?: string;
	},
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO mcqs (id, name, question, created_by_user_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
		)
		.bind(
			input.id,
			input.name,
			input.question,
			input.createdByUserId,
			input.createdAt ?? now,
			input.updatedAt ?? now,
		)
		.run();
}

async function insertMcqChoice(
	db: D1Database,
	input: {
		id: string;
		mcqId: string;
		choiceText: string;
		isCorrect: boolean;
		position: number;
	},
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, position, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
		)
		.bind(
			input.id,
			input.mcqId,
			input.choiceText,
			input.isCorrect ? 1 : 0,
			input.position,
			now,
			now,
		)
		.run();
}

async function insertMcqAttempt(
	db: D1Database,
	input: {
		id: string;
		mcqId: string;
		userId: string;
		selectedChoiceId: string;
		isCorrect: boolean;
	},
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
		)
		.bind(
			input.id,
			input.mcqId,
			input.userId,
			input.selectedChoiceId,
			input.isCorrect ? 1 : 0,
			now,
		)
		.run();
}

describe("Phase 2 MCQ migrations and models (TC-M2-01 – TC-M2-06)", () => {
	let db: D1Database;
	let userId: string;

	beforeEach(async () => {
		db = createMockD1Database();
		const result = await createUser(db, TEST_USER);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		userId = result.user.id;
	});

	it("TC-M2-01: migration SQL file exists and creates three tables", () => {
		const sql = readFileSync(MIGRATION_PATH, "utf-8");

		expect(sql).toMatch(/CREATE TABLE mcqs/i);
		expect(sql).toMatch(/CREATE TABLE mcq_choices/i);
		expect(sql).toMatch(/CREATE TABLE mcq_attempts/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcqs_created_by_user_id/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcqs_created_at/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcq_choices_mcq_id/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcq_attempts_mcq_id/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcq_attempts_user_id/i);
		expect(sql).toMatch(/CREATE INDEX idx_mcq_attempts_mcq_user/i);
		expect(sql).toMatch(
			/FOREIGN KEY \(created_by_user_id\) REFERENCES users \(id\) ON DELETE CASCADE/i,
		);
		expect(sql).toMatch(
			/FOREIGN KEY \(mcq_id\) REFERENCES mcqs \(id\) ON DELETE CASCADE/i,
		);
	});

	it("TC-M2-02: mock D1 can insert and retrieve an MCQ row", async () => {
		const mcqId = crypto.randomUUID();
		const createdAt = "2026-09-01T10:00:00.000Z";
		const updatedAt = "2026-09-01T10:00:00.000Z";

		await insertMcq(db, {
			id: mcqId,
			name: "Capital Cities",
			question: "What is the capital of France?",
			createdByUserId: userId,
			createdAt,
			updatedAt,
		});

		const { results } = await db
			.prepare(
				`SELECT id, name, question, created_by_user_id, created_at, updated_at
         FROM mcqs
         WHERE id = ?1`,
			)
			.bind(mcqId)
			.all<McqRow>();

		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({
			id: mcqId,
			name: "Capital Cities",
			question: "What is the capital of France?",
			created_by_user_id: userId,
			created_at: createdAt,
			updated_at: updatedAt,
		});
	});

	it("TC-M2-03: mock D1 enforces FK from mcq_choices to mcqs", async () => {
		await expect(
			insertMcqChoice(db, {
				id: crypto.randomUUID(),
				mcqId: crypto.randomUUID(),
				choiceText: "Paris",
				isCorrect: true,
				position: 1,
			}),
		).rejects.toThrow(/FOREIGN KEY constraint failed: mcq_choices\.mcq_id/);
	});

	it("TC-M2-04: mock D1 CASCADE deletes choices when MCQ deleted", async () => {
		const mcqId = crypto.randomUUID();
		await insertMcq(db, {
			id: mcqId,
			name: "Sample",
			question: "Sample question?",
			createdByUserId: userId,
		});
		await insertMcqChoice(db, {
			id: crypto.randomUUID(),
			mcqId,
			choiceText: "A",
			isCorrect: true,
			position: 1,
		});
		await insertMcqChoice(db, {
			id: crypto.randomUUID(),
			mcqId,
			choiceText: "B",
			isCorrect: false,
			position: 2,
		});

		expect(getMockMcqChoiceCount(db, mcqId)).toBe(2);

		await db.prepare(`DELETE FROM mcqs WHERE id = ?1`).bind(mcqId).run();

		expect(getMockMcqChoiceCount(db, mcqId)).toBe(0);

		const { results } = await db
			.prepare(`SELECT id FROM mcqs WHERE id = ?1`)
			.bind(mcqId)
			.all<{ id: string }>();
		expect(results).toHaveLength(0);
	});

	it("TC-M2-05: mock D1 stores attempt with is_correct flag", async () => {
		const mcqId = crypto.randomUUID();
		const choiceId = crypto.randomUUID();
		const attemptId = crypto.randomUUID();

		await insertMcq(db, {
			id: mcqId,
			name: "Sample",
			question: "Sample question?",
			createdByUserId: userId,
		});
		await insertMcqChoice(db, {
			id: choiceId,
			mcqId,
			choiceText: "Correct",
			isCorrect: true,
			position: 1,
		});

		await insertMcqAttempt(db, {
			id: attemptId,
			mcqId,
			userId,
			selectedChoiceId: choiceId,
			isCorrect: true,
		});

		const { results } = await db
			.prepare(
				`SELECT id, mcq_id, user_id, selected_choice_id, is_correct, created_at
         FROM mcq_attempts
         WHERE id = ?1`,
			)
			.bind(attemptId)
			.all<McqAttemptRow>();

		expect(results).toHaveLength(1);
		expect(results[0]?.mcq_id).toBe(mcqId);
		expect(results[0]?.user_id).toBe(userId);
		expect(results[0]?.selected_choice_id).toBe(choiceId);
		expect(results[0]?.is_correct).toBe(1);
	});

	it("TC-M2-06: domain config constants match PRD limits", () => {
		expect(MCQ_NAME_MAX_LENGTH).toBe(200);
		expect(MCQ_QUESTION_MAX_LENGTH).toBe(2000);
		expect(MCQ_CHOICE_TEXT_MAX_LENGTH).toBe(500);
		expect(MCQ_MIN_CHOICES).toBe(2);
		expect(MCQ_MAX_CHOICES).toBe(6);
	});
});
