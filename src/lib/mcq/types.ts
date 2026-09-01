export type Mcq = {
	id: string;
	name: string;
	question: string;
	createdByUserId: string;
	createdAt: string;
	updatedAt: string;
};

export type McqChoice = {
	id: string;
	mcqId: string;
	choiceText: string;
	isCorrect: boolean;
	position: number;
	createdAt: string;
	updatedAt: string;
};

export type McqWithChoices = Mcq & { choices: McqChoice[] };

export type McqListItem = Mcq & {
	choiceCount: number;
};

export type McqAttempt = {
	id: string;
	mcqId: string;
	userId: string;
	selectedChoiceId: string;
	isCorrect: boolean;
	createdAt: string;
};

export type PreviewMcqChoice = {
	id: string;
	choiceText: string;
	position: number;
};

export type PreviewMcq = {
	id: string;
	name: string;
	question: string;
	choices: PreviewMcqChoice[];
};

export type CreateMcqInput = {
	name: string;
	question: string;
	choices: { choiceText: string; isCorrect: boolean }[];
};

export type UpdateMcqInput = CreateMcqInput;

export type RecordAttemptInput = {
	selectedChoiceId: string;
};
