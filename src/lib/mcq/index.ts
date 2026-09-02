export { recordAttempt, deleteAttemptsByMcqId } from "@/lib/mcq/attempts";
export { findOwnedMcq } from "@/lib/mcq/authorization";
export {
	deleteChoicesByMcqId,
	findChoiceForMcq,
	insertChoices,
	listChoicesByMcqId,
} from "@/lib/mcq/choices";
export {
	MCQ_CHOICE_TEXT_MAX_LENGTH,
	MCQ_MAX_CHOICES,
	MCQ_MIN_CHOICES,
	MCQ_NAME_MAX_LENGTH,
	MCQ_QUESTION_MAX_LENGTH,
} from "@/lib/mcq/config";
export { MCQ_MESSAGES } from "@/lib/mcq/messages";
export {
	createMcq,
	deleteMcq,
	getMcqById,
	getMcqPreview,
	listMcqsByUser,
	updateMcq,
} from "@/lib/mcq/mcqs";
export {
	mcqInputSchema,
	parseMcqInput,
	parseRecordAttemptInput,
	recordAttemptSchema,
	zodErrorsToMcqFieldErrors,
} from "@/lib/mcq/schemas/mcq";
export type {
	CreateMcqInput,
	Mcq,
	McqAttempt,
	McqChoice,
	McqListItem,
	McqWithChoices,
	PreviewMcq,
	PreviewMcqChoice,
	RecordAttemptInput,
	UpdateMcqInput,
} from "@/lib/mcq/types";
export {
	getMcqFieldErrors,
	hasMcqFieldErrors,
	normalizeMcqInput,
	validateMcqChoiceText,
	validateMcqChoices,
	validateMcqName,
	validateMcqQuestion,
} from "@/lib/mcq/validation";
export type { McqChoiceInput, McqFieldErrors } from "@/lib/mcq/validation";
