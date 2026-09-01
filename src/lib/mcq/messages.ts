/** User-facing MCQ messages aligned with ai-workspace/mcq-crud_prd.md */

export const MCQ_MESSAGES = {
	nameRequired: "MCQ name is required.",
	nameTooLong: "MCQ name must be 200 characters or fewer.",
	questionRequired: "Question is required.",
	questionTooLong: "Question must be 2000 characters or fewer.",
	tooFewChoices: "At least 2 answer choices are required.",
	tooManyChoices: "A maximum of 6 answer choices is allowed.",
	choiceTextRequired: "Answer choice text is required.",
	choiceTextTooLong: "Answer choice must be 500 characters or fewer.",
	correctAnswerRequired:
		"Exactly one answer choice must be marked as correct.",
	notFound: "Multiple choice question not found.",
	invalidSelectedChoice: "Selected answer is not valid for this question.",
	somethingWentWrong: "Something went wrong. Please try again later.",
} as const;
