"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { PreviewMcq } from "@/lib/mcq/types";

type McqPreviewDialogProps = {
	mcqId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function McqPreviewDialog({
	mcqId,
	open,
	onOpenChange,
}: McqPreviewDialogProps) {
	const [preview, setPreview] = useState<PreviewMcq | null>(null);
	const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
	const [selectionError, setSelectionError] = useState<string | null>(null);
	const [resultMessage, setResultMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !mcqId) {
			return;
		}

		let cancelled = false;

		async function loadPreview() {
			setIsLoading(true);
			setLoadError(null);
			setPreview(null);
			setSelectedChoiceId(null);
			setSelectionError(null);
			setResultMessage(null);

			try {
				const response = await fetch(`/api/mcqs/${mcqId}/preview`, {
					credentials: "include",
				});

				if (!response.ok) {
					if (!cancelled) {
						setLoadError(MCQ_MESSAGES.notFound);
					}
					return;
				}

				const body = (await response.json()) as { preview: PreviewMcq };
				if (!cancelled) {
					setPreview(body.preview);
				}
			} catch {
				if (!cancelled) {
					setLoadError(MCQ_MESSAGES.somethingWentWrong);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		void loadPreview();

		return () => {
			cancelled = true;
		};
	}, [open, mcqId]);

	async function handleSubmit() {
		if (!mcqId) {
			return;
		}

		if (!selectedChoiceId) {
			setSelectionError(MCQ_MESSAGES.selectAnswerRequired);
			return;
		}

		setSelectionError(null);
		setIsSubmitting(true);

		try {
			const response = await fetch(`/api/mcqs/${mcqId}/attempts`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ selectedChoiceId }),
			});

			if (!response.ok) {
				setResultMessage(MCQ_MESSAGES.somethingWentWrong);
				return;
			}

			const body = (await response.json()) as { isCorrect: boolean };
			setResultMessage(
				body.isCorrect ? MCQ_MESSAGES.previewCorrect : MCQ_MESSAGES.previewIncorrect,
			);
		} catch {
			setResultMessage(MCQ_MESSAGES.somethingWentWrong);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg" showCloseButton>
				<DialogHeader>
					<DialogTitle>{preview?.name ?? "Preview Question"}</DialogTitle>
					<DialogDescription>
						{isLoading
							? "Loading preview..."
							: (preview?.question ?? "Review this multiple choice question.")}
					</DialogDescription>
				</DialogHeader>

				{loadError ? (
					<p role="alert" className="text-sm text-destructive">
						{loadError}
					</p>
				) : null}

				{preview ? (
					<div className="space-y-3">
						{preview.choices.map((choice) => (
							<label
								key={choice.id}
								className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
							>
								<input
									type="radio"
									name="previewChoice"
									value={choice.id}
									checked={selectedChoiceId === choice.id}
									onChange={() => setSelectedChoiceId(choice.id)}
									disabled={isSubmitting || !!resultMessage}
									aria-label={choice.choiceText}
								/>
								<span>{choice.choiceText}</span>
							</label>
						))}
					</div>
				) : null}

				{selectionError ? (
					<FieldError errors={[{ message: selectionError }]} />
				) : null}

				{resultMessage ? (
					<p
						role="status"
						className={
							resultMessage === MCQ_MESSAGES.previewCorrect
								? "text-sm font-medium text-green-600 dark:text-green-400"
								: "text-sm font-medium text-destructive"
						}
					>
						{resultMessage}
					</p>
				) : null}

				<DialogFooter showCloseButton={!!resultMessage}>
					{!resultMessage ? (
						<Button
							type="button"
							onClick={handleSubmit}
							disabled={isLoading || isSubmitting || !preview}
						>
							{isSubmitting ? "Submitting..." : "Submit Answer"}
						</Button>
					) : null}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
