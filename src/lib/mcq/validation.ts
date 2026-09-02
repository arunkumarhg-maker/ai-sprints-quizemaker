import {
	MCQ_CHOICE_TEXT_MAX_LENGTH,
	MCQ_MAX_CHOICES,
	MCQ_MIN_CHOICES,
	MCQ_NAME_MAX_LENGTH,
	MCQ_QUESTION_MAX_LENGTH,
} from "@/lib/mcq/config";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { CreateMcqInput } from "@/lib/mcq/types";

export type McqChoiceInput = CreateMcqInput["choices"][number];

export type McqFieldErrors = Partial<
	Record<"name" | "question" | "choices" | "form", string>
>;

export function validateMcqName(name: string): string | null {
	const trimmed = name.trim();
	if (!trimmed) {
		return MCQ_MESSAGES.nameRequired;
	}
	if (trimmed.length > MCQ_NAME_MAX_LENGTH) {
		return MCQ_MESSAGES.nameTooLong;
	}
	return null;
}

export function validateMcqQuestion(question: string): string | null {
	const trimmed = question.trim();
	if (!trimmed) {
		return MCQ_MESSAGES.questionRequired;
	}
	if (trimmed.length > MCQ_QUESTION_MAX_LENGTH) {
		return MCQ_MESSAGES.questionTooLong;
	}
	return null;
}

export function validateMcqChoiceText(choiceText: string): string | null {
	const trimmed = choiceText.trim();
	if (!trimmed) {
		return MCQ_MESSAGES.choiceTextRequired;
	}
	if (trimmed.length > MCQ_CHOICE_TEXT_MAX_LENGTH) {
		return MCQ_MESSAGES.choiceTextTooLong;
	}
	return null;
}

export function validateMcqChoices(
	choices: McqChoiceInput[],
): string | null {
	if (choices.length < MCQ_MIN_CHOICES) {
		return MCQ_MESSAGES.tooFewChoices;
	}
	if (choices.length > MCQ_MAX_CHOICES) {
		return MCQ_MESSAGES.tooManyChoices;
	}

	for (const choice of choices) {
		const choiceError = validateMcqChoiceText(choice.choiceText);
		if (choiceError) {
			return choiceError;
		}
	}

	const correctCount = choices.filter((choice) => choice.isCorrect).length;
	if (correctCount !== 1) {
		return MCQ_MESSAGES.correctAnswerRequired;
	}

	return null;
}

export function getMcqFieldErrors(input: CreateMcqInput): McqFieldErrors {
	const errors: McqFieldErrors = {};

	const nameError = validateMcqName(input.name);
	if (nameError) {
		errors.name = nameError;
	}

	const questionError = validateMcqQuestion(input.question);
	if (questionError) {
		errors.question = questionError;
	}

	const choicesError = validateMcqChoices(input.choices);
	if (choicesError) {
		errors.choices = choicesError;
	}

	return errors;
}

export function hasMcqFieldErrors(errors: McqFieldErrors): boolean {
	return Object.keys(errors).length > 0;
}

export function normalizeMcqInput(input: CreateMcqInput): CreateMcqInput {
	return {
		name: input.name.trim(),
		question: input.question.trim(),
		choices: input.choices.map((choice) => ({
			choiceText: choice.choiceText.trim(),
			isCorrect: choice.isCorrect,
		})),
	};
}
