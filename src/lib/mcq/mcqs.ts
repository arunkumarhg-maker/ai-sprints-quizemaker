import { findOwnedMcq } from "@/lib/mcq/authorization";
import {
	deleteChoicesByMcqId,
	insertChoices,
	listChoicesByMcqId,
} from "@/lib/mcq/choices";
import { deleteAttemptsByMcqId } from "@/lib/mcq/attempts";
import { getMcqFieldErrors, normalizeMcqInput } from "@/lib/mcq/validation";
import type {
	CreateMcqInput,
	McqListItem,
	McqWithChoices,
	PreviewMcq,
	UpdateMcqInput,
} from "@/lib/mcq/types";

type McqRow = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

type McqListRow = McqRow & {
	choice_count: number;
};

function mapMcq(row: McqRow) {
	return {
		id: row.id,
		name: row.name,
		question: row.question,
		createdByUserId: row.created_by_user_id,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function listMcqsByUser(
	db: D1Database,
	userId: string,
): Promise<McqListItem[]> {
	const { results } = await db
		.prepare(
			`SELECT m.id, m.name, m.question, m.created_by_user_id, m.created_at, m.updated_at,
              (SELECT COUNT(*) FROM mcq_choices c WHERE c.mcq_id = m.id) AS choice_count
       FROM mcqs m
       WHERE m.created_by_user_id = ?1
       ORDER BY m.created_at DESC`,
		)
		.bind(userId)
		.all<McqListRow>();

	return results.map((row) => ({
		...mapMcq(row),
		choiceCount: row.choice_count,
	}));
}

export async function getMcqById(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<McqWithChoices | null> {
	const mcq = await findOwnedMcq(db, mcqId, userId);
	if (!mcq) {
		return null;
	}

	const choices = await listChoicesByMcqId(db, mcqId);
	return { ...mcq, choices };
}

export async function createMcq(
	db: D1Database,
	userId: string,
	input: CreateMcqInput,
): Promise<McqWithChoices> {
	const normalized = normalizeMcqInput(input);
	const fieldErrors = getMcqFieldErrors(normalized);
	if (Object.keys(fieldErrors).length > 0) {
		throw new Error("Invalid MCQ input");
	}

	const id = crypto.randomUUID();
	const now = new Date().toISOString();

	const insertResult = await db
		.prepare(
			`INSERT INTO mcqs (id, name, question, created_by_user_id, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
		)
		.bind(
			id,
			normalized.name,
			normalized.question,
			userId,
			now,
			now,
		)
		.run();

	if (!insertResult.success) {
		throw new Error("Failed to create MCQ");
	}

	const choices = await insertChoices(db, id, normalized.choices);

	return {
		id,
		name: normalized.name,
		question: normalized.question,
		createdByUserId: userId,
		createdAt: now,
		updatedAt: now,
		choices,
	};
}

export async function updateMcq(
	db: D1Database,
	mcqId: string,
	userId: string,
	input: UpdateMcqInput,
): Promise<McqWithChoices | null> {
	const existing = await findOwnedMcq(db, mcqId, userId);
	if (!existing) {
		return null;
	}

	const normalized = normalizeMcqInput(input);
	const fieldErrors = getMcqFieldErrors(normalized);
	if (Object.keys(fieldErrors).length > 0) {
		throw new Error("Invalid MCQ input");
	}

	const now = new Date().toISOString();

	const updateResult = await db
		.prepare(
			`UPDATE mcqs
       SET name = ?1, question = ?2, updated_at = ?3
       WHERE id = ?4 AND created_by_user_id = ?5`,
		)
		.bind(normalized.name, normalized.question, now, mcqId, userId)
		.run();

	if (!updateResult.success) {
		throw new Error("Failed to update MCQ");
	}

	await deleteAttemptsByMcqId(db, mcqId);
	await deleteChoicesByMcqId(db, mcqId);
	const choices = await insertChoices(db, mcqId, normalized.choices);

	return {
		...existing,
		name: normalized.name,
		question: normalized.question,
		updatedAt: now,
		choices,
	};
}

export async function deleteMcq(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<boolean> {
	const existing = await findOwnedMcq(db, mcqId, userId);
	if (!existing) {
		return false;
	}

	const result = await db
		.prepare(`DELETE FROM mcqs WHERE id = ?1 AND created_by_user_id = ?2`)
		.bind(mcqId, userId)
		.run();

	return result.success;
}

export async function getMcqPreview(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<PreviewMcq | null> {
	const mcq = await findOwnedMcq(db, mcqId, userId);
	if (!mcq) {
		return null;
	}

	const choices = await listChoicesByMcqId(db, mcqId);

	return {
		id: mcq.id,
		name: mcq.name,
		question: mcq.question,
		choices: choices.map((choice) => ({
			id: choice.id,
			choiceText: choice.choiceText,
			position: choice.position,
		})),
	};
}
