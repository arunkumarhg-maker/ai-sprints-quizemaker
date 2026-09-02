import type { Mcq } from "@/lib/mcq/types";

type McqRow = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

function mapMcq(row: McqRow): Mcq {
	return {
		id: row.id,
		name: row.name,
		question: row.question,
		createdByUserId: row.created_by_user_id,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

export async function findOwnedMcq(
	db: D1Database,
	mcqId: string,
	userId: string,
): Promise<Mcq | null> {
	const { results } = await db
		.prepare(
			`SELECT id, name, question, created_by_user_id, created_at, updated_at
       FROM mcqs
       WHERE id = ?1 AND created_by_user_id = ?2`,
		)
		.bind(mcqId, userId)
		.all<McqRow>();

	const row = results[0];
	return row ? mapMcq(row) : null;
}
