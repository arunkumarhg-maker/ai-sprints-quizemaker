import type { McqChoice } from "@/lib/mcq/types";
import type { McqChoiceInput } from "@/lib/mcq/validation";

type McqChoiceRow = {
	id: string;
	mcq_id: string;
	choice_text: string;
	is_correct: number;
	position: number;
	created_at: string;
	updated_at: string;
};

function mapChoice(row: McqChoiceRow): McqChoice {
	return {
		id: row.id,
		mcqId: row.mcq_id,
		choiceText: row.choice_text,
		isCorrect: row.is_correct === 1,
		position: row.position,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function listChoicesByMcqId(
	db: D1Database,
	mcqId: string,
): Promise<McqChoice[]> {
	const { results } = await db
		.prepare(
			`SELECT id, mcq_id, choice_text, is_correct, position, created_at, updated_at
       FROM mcq_choices
       WHERE mcq_id = ?1
       ORDER BY position ASC`,
		)
		.bind(mcqId)
		.all<McqChoiceRow>();

	return results.map(mapChoice);
}

export async function findChoiceForMcq(
	db: D1Database,
	mcqId: string,
	choiceId: string,
): Promise<McqChoice | null> {
	const { results } = await db
		.prepare(
			`SELECT id, mcq_id, choice_text, is_correct, position, created_at, updated_at
       FROM mcq_choices
       WHERE id = ?1 AND mcq_id = ?2`,
		)
		.bind(choiceId, mcqId)
		.all<McqChoiceRow>();

	const row = results[0];
	return row ? mapChoice(row) : null;
}

export async function insertChoices(
	db: D1Database,
	mcqId: string,
	choices: McqChoiceInput[],
): Promise<McqChoice[]> {
	const now = new Date().toISOString();
	const inserted: McqChoice[] = [];

	for (const [index, choice] of choices.entries()) {
		const id = crypto.randomUUID();
		const position = index + 1;
		const result = await db
			.prepare(
				`INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, position, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
			)
			.bind(
				id,
				mcqId,
				choice.choiceText,
				choice.isCorrect ? 1 : 0,
				position,
				now,
				now,
			)
			.run();

		if (!result.success) {
			throw new Error("Failed to insert MCQ choice");
		}

		inserted.push({
			id,
			mcqId,
			choiceText: choice.choiceText,
			isCorrect: choice.isCorrect,
			position,
			createdAt: now,
			updatedAt: now,
		});
	}

	return inserted;
}

export async function deleteChoicesByMcqId(
	db: D1Database,
	mcqId: string,
): Promise<void> {
	await db
		.prepare(`DELETE FROM mcq_choices WHERE mcq_id = ?1`)
		.bind(mcqId)
		.run();
}
