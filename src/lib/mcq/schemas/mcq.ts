import { z } from "zod";

import {
	getMcqFieldErrors,
	type McqFieldErrors,
	normalizeMcqInput,
} from "@/lib/mcq/validation";
import type { CreateMcqInput, RecordAttemptInput } from "@/lib/mcq/types";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";

export type { McqFieldErrors };

const mcqChoiceSchema = z.object({
	choiceText: z.string(),
	isCorrect: z.boolean(),
});

export const mcqInputSchema = z
	.object({
		name: z.string(),
		question: z.string(),
		choices: z.array(mcqChoiceSchema),
	})
	.superRefine((data, ctx) => {
		const fieldErrors = getMcqFieldErrors(data);
		for (const [field, message] of Object.entries(fieldErrors)) {
			if (message) {
				ctx.addIssue({
					code: "custom",
					message,
					path: [field],
				});
			}
		}
	});

export const recordAttemptSchema = z.object({
	selectedChoiceId: z.string().min(1, MCQ_MESSAGES.invalidSelectedChoice),
});

export function parseMcqInput(input: CreateMcqInput): CreateMcqInput {
	return normalizeMcqInput(input);
}

export function zodErrorsToMcqFieldErrors(error: z.ZodError): McqFieldErrors {
	const fieldErrors: McqFieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (field === "name" || field === "question" || field === "choices") {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
}

export function parseRecordAttemptInput(
	input: RecordAttemptInput,
): RecordAttemptInput {
	return {
		selectedChoiceId: input.selectedChoiceId.trim(),
	};
}
