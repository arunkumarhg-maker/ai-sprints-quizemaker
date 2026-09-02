import { findOwnedMcq } from "@/lib/mcq/authorization";
import { findChoiceForMcq } from "@/lib/mcq/choices";
import type { McqAttempt } from "@/lib/mcq/types";

export async function deleteAttemptsByMcqId(
	db: D1Database,
	mcqId: string,
): Promise<void> {
	await db
		.prepare(`DELETE FROM mcq_attempts WHERE mcq_id = ?1`)
		.bind(mcqId)
		.run();
}

export async function recordAttempt(
	db: D1Database,
	mcqId: string,
	userId: string,
	selectedChoiceId: string,
): Promise<{ attempt: McqAttempt; isCorrect: boolean } | null> {
	const mcq = await findOwnedMcq(db, mcqId, userId);
	if (!mcq) {
		return null;
	}

	const choice = await findChoiceForMcq(db, mcqId, selectedChoiceId);
	if (!choice) {
		return null;
	}

	const id = crypto.randomUUID();
	const now = new Date().toISOString();
	const isCorrect = choice.isCorrect;

	const result = await db
		.prepare(
			`INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
		)
		.bind(id, mcqId, userId, selectedChoiceId, isCorrect ? 1 : 0, now)
		.run();

	if (!result.success) {
		throw new Error("Failed to record MCQ attempt");
	}

	return {
		attempt: {
			id,
			mcqId,
			userId,
			selectedChoiceId,
			isCorrect,
			createdAt: now,
		},
		isCorrect,
	};
}
