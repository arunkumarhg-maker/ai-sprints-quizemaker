export const MCQ_QUESTION_TABLE_MAX_LENGTH = 80;

export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength - 1)}…`;
}

export function formatMcqCreatedAt(iso: string): string {
	return new Date(iso).toLocaleString();
}
