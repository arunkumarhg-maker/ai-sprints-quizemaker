import { beforeEach, describe, expect, it } from "vitest";

import {
	createMockD1Database,
	getMockMcqAttemptCount,
} from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";
import { recordAttempt } from "@/lib/mcq/attempts";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import {
	createMcq,
	deleteMcq,
	getMcqById,
	getMcqPreview,
	listMcqsByUser,
	updateMcq,
} from "@/lib/mcq/mcqs";
import { mcqInputSchema } from "@/lib/mcq/schemas/mcq";
import type { CreateMcqInput } from "@/lib/mcq/types";

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

function oneChoiceMcq(): CreateMcqInput {
	return {
		...VALID_MCQ,
		choices: [{ choiceText: "Only", isCorrect: true }],
	};
}

function sevenChoiceMcq(): CreateMcqInput {
	return {
		...VALID_MCQ,
		choices: [
			{ choiceText: "A", isCorrect: true },
			{ choiceText: "B", isCorrect: false },
			{ choiceText: "C", isCorrect: false },
			{ choiceText: "D", isCorrect: false },
			{ choiceText: "E", isCorrect: false },
			{ choiceText: "F", isCorrect: false },
			{ choiceText: "G", isCorrect: false },
		],
	};
}

describe("Phase 3 MCQ service layer (TC-M3-01 – TC-M3-18)", () => {
	let db: D1Database;
	let userId: string;
	let otherUserId: string;

	beforeEach(async () => {
		db = createMockD1Database();

		const userResult = await createUser(db, TEST_USER);
		expect(userResult.ok).toBe(true);
		if (!userResult.ok) return;
		userId = userResult.user.id;

		const otherResult = await createUser(db, OTHER_USER);
		expect(otherResult.ok).toBe(true);
		if (!otherResult.ok) return;
		otherUserId = otherResult.user.id;
	});

	it("TC-M3-01: valid create payload passes schema", () => {
		const parsed = mcqInputSchema.safeParse(VALID_MCQ);
		expect(parsed.success).toBe(true);
	});

	it("TC-M3-02: name empty fails validation", () => {
		const parsed = mcqInputSchema.safeParse({ ...VALID_MCQ, name: "   " });
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.error.issues.some((issue) => issue.message === MCQ_MESSAGES.nameRequired)).toBe(true);
	});

	it("TC-M3-03: question empty fails validation", () => {
		const parsed = mcqInputSchema.safeParse({ ...VALID_MCQ, question: "" });
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.questionRequired,
			),
		).toBe(true);
	});

	it("TC-M3-04: one choice fails min count", () => {
		const parsed = mcqInputSchema.safeParse(oneChoiceMcq());
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.tooFewChoices,
			),
		).toBe(true);
	});

	it("TC-M3-05: seven choices fail max count", () => {
		const parsed = mcqInputSchema.safeParse(sevenChoiceMcq());
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.tooManyChoices,
			),
		).toBe(true);
	});

	it("TC-M3-06: zero correct answers fails", () => {
		const parsed = mcqInputSchema.safeParse({
			...VALID_MCQ,
			choices: [
				{ choiceText: "Paris", isCorrect: false },
				{ choiceText: "London", isCorrect: false },
			],
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.correctAnswerRequired,
			),
		).toBe(true);
	});

	it("TC-M3-07: two correct answers fails", () => {
		const parsed = mcqInputSchema.safeParse({
			...VALID_MCQ,
			choices: [
				{ choiceText: "Paris", isCorrect: true },
				{ choiceText: "London", isCorrect: true },
			],
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.correctAnswerRequired,
			),
		).toBe(true);
	});

	it("TC-M3-08: empty choice text fails", () => {
		const parsed = mcqInputSchema.safeParse({
			...VALID_MCQ,
			choices: [
				{ choiceText: "Paris", isCorrect: true },
				{ choiceText: "   ", isCorrect: false },
			],
		});
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(
			parsed.error.issues.some(
				(issue) => issue.message === MCQ_MESSAGES.choiceTextRequired,
			),
		).toBe(true);
	});

	it("TC-M3-09: createMcq persists MCQ and choices", async () => {
		const mcq = await createMcq(db, userId, VALID_MCQ);

		expect(mcq.name).toBe(VALID_MCQ.name);
		expect(mcq.question).toBe(VALID_MCQ.question);
		expect(mcq.createdByUserId).toBe(userId);
		expect(mcq.choices).toHaveLength(2);
		expect(mcq.choices[0]?.choiceText).toBe("Paris");
		expect(mcq.choices[0]?.isCorrect).toBe(true);
		expect(mcq.choices[1]?.isCorrect).toBe(false);
	});

	it("TC-M3-10: listMcqsByUser returns only owning user's MCQs", async () => {
		await createMcq(db, userId, VALID_MCQ);
		await createMcq(db, otherUserId, {
			...VALID_MCQ,
			name: "Other user's MCQ",
		});

		const listed = await listMcqsByUser(db, userId);

		expect(listed).toHaveLength(1);
		expect(listed[0]?.name).toBe(VALID_MCQ.name);
		expect(listed[0]?.createdByUserId).toBe(userId);
	});

	it("TC-M3-11: getMcqById returns null for wrong owner", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const result = await getMcqById(db, created.id, otherUserId);
		expect(result).toBeNull();
	});

	it("TC-M3-12: updateMcq replaces choices", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const originalChoiceIds = created.choices.map((choice) => choice.id);

		const updated = await updateMcq(db, created.id, userId, {
			name: "Updated Name",
			question: "Updated question?",
			choices: [
				{ choiceText: "Alpha", isCorrect: false },
				{ choiceText: "Beta", isCorrect: true },
				{ choiceText: "Gamma", isCorrect: false },
			],
		});

		expect(updated).not.toBeNull();
		if (!updated) return;

		expect(updated.name).toBe("Updated Name");
		expect(updated.question).toBe("Updated question?");
		expect(updated.choices).toHaveLength(3);
		expect(updated.choices.some((choice) => choice.choiceText === "Beta" && choice.isCorrect)).toBe(true);
		expect(
			updated.choices.every((choice) => !originalChoiceIds.includes(choice.id)),
		).toBe(true);
	});

	it("TC-M3-13: updateMcq clears prior attempts", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const correctChoiceId = created.choices.find((choice) => choice.isCorrect)?.id;
		expect(correctChoiceId).toBeTruthy();
		if (!correctChoiceId) return;

		await recordAttempt(db, created.id, userId, correctChoiceId);
		expect(getMockMcqAttemptCount(db, created.id)).toBe(1);

		await updateMcq(db, created.id, userId, {
			...VALID_MCQ,
			name: "After attempt",
		});

		expect(getMockMcqAttemptCount(db, created.id)).toBe(0);
	});

	it("TC-M3-14: deleteMcq removes MCQ and cascaded rows", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const correctChoiceId = created.choices.find((choice) => choice.isCorrect)?.id;
		expect(correctChoiceId).toBeTruthy();
		if (!correctChoiceId) return;

		await recordAttempt(db, created.id, userId, correctChoiceId);

		const deleted = await deleteMcq(db, created.id, userId);
		expect(deleted).toBe(true);
		expect(await getMcqById(db, created.id, userId)).toBeNull();
		expect(getMockMcqAttemptCount(db, created.id)).toBe(0);
	});

	it("TC-M3-15: getMcqPreview omits isCorrect", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const preview = await getMcqPreview(db, created.id, userId);

		expect(preview).not.toBeNull();
		if (!preview) return;

		expect(preview.name).toBe(VALID_MCQ.name);
		expect(preview.choices).toHaveLength(2);
		for (const choice of preview.choices) {
			expect(choice).not.toHaveProperty("isCorrect");
			expect(choice.choiceText).toBeTruthy();
			expect(choice.position).toBeGreaterThan(0);
		}
	});

	it("TC-M3-16: recordAttempt sets is_correct true for correct choice", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const correctChoiceId = created.choices.find((choice) => choice.isCorrect)?.id;
		expect(correctChoiceId).toBeTruthy();
		if (!correctChoiceId) return;

		const result = await recordAttempt(db, created.id, userId, correctChoiceId);

		expect(result).not.toBeNull();
		if (!result) return;
		expect(result.isCorrect).toBe(true);
		expect(result.attempt.isCorrect).toBe(true);
	});

	it("TC-M3-17: recordAttempt sets is_correct false for wrong choice", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const wrongChoiceId = created.choices.find((choice) => !choice.isCorrect)?.id;
		expect(wrongChoiceId).toBeTruthy();
		if (!wrongChoiceId) return;

		const result = await recordAttempt(db, created.id, userId, wrongChoiceId);

		expect(result).not.toBeNull();
		if (!result) return;
		expect(result.isCorrect).toBe(false);
		expect(result.attempt.isCorrect).toBe(false);
	});

	it("TC-M3-18: recordAttempt rejects invalid choice ID", async () => {
		const created = await createMcq(db, userId, VALID_MCQ);
		const result = await recordAttempt(
			db,
			created.id,
			userId,
			crypto.randomUUID(),
		);
		expect(result).toBeNull();
	});
});
