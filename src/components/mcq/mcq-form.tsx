"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MCQ_MAX_CHOICES, MCQ_MIN_CHOICES } from "@/lib/mcq/config";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import {
	mcqInputSchema,
	zodErrorsToMcqFieldErrors,
} from "@/lib/mcq/schemas/mcq";
import type { CreateMcqInput } from "@/lib/mcq/types";
import type { McqFieldErrors } from "@/lib/mcq/validation";
import { cn } from "@/lib/utils";

type ChoiceDraft = CreateMcqInput["choices"][number];

type McqFormProps = {
	mode: "create" | "edit";
	mcqId?: string;
	initialValues?: CreateMcqInput;
};

function createDefaultChoices(): ChoiceDraft[] {
	return [
		{ choiceText: "", isCorrect: true },
		{ choiceText: "", isCorrect: false },
	];
}

export function McqForm({
	mode,
	mcqId,
	initialValues,
}: McqFormProps) {
	const router = useRouter();
	const [name, setName] = useState(initialValues?.name ?? "");
	const [question, setQuestion] = useState(initialValues?.question ?? "");
	const [choices, setChoices] = useState<ChoiceDraft[]>(
		initialValues?.choices ?? createDefaultChoices(),
	);
	const [errors, setErrors] = useState<McqFieldErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateChoiceText(index: number, choiceText: string) {
		setChoices((current) =>
			current.map((choice, choiceIndex) =>
				choiceIndex === index ? { ...choice, choiceText } : choice,
			),
		);
	}

	function setCorrectChoice(index: number) {
		setChoices((current) =>
			current.map((choice, choiceIndex) => ({
				...choice,
				isCorrect: choiceIndex === index,
			})),
		);
	}

	function addChoice() {
		if (choices.length >= MCQ_MAX_CHOICES) {
			return;
		}

		setChoices((current) => [
			...current,
			{ choiceText: "", isCorrect: false },
		]);
	}

	function removeChoice(index: number) {
		if (choices.length <= MCQ_MIN_CHOICES) {
			return;
		}

		setChoices((current) => {
			const next = current.filter((_, choiceIndex) => choiceIndex !== index);
			if (!next.some((choice) => choice.isCorrect)) {
				next[0] = { ...next[0]!, isCorrect: true };
			}
			return next;
		});
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrors({});
		setFormError(null);

		const payload: CreateMcqInput = { name, question, choices };
		const parsed = mcqInputSchema.safeParse(payload);
		if (!parsed.success) {
			setErrors(zodErrorsToMcqFieldErrors(parsed.error));
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(
				mode === "create" ? "/api/mcqs" : `/api/mcqs/${mcqId}`,
				{
					method: mode === "create" ? "POST" : "PUT",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(parsed.data),
				},
			);

			if (response.status === 400) {
				const body = (await response.json()) as {
					errors?: McqFieldErrors;
					error?: string;
				};
				if (body.errors) {
					setErrors(body.errors);
				} else {
					setFormError(body.error ?? MCQ_MESSAGES.somethingWentWrong);
				}
				return;
			}

			if (response.status === 404) {
				setFormError(MCQ_MESSAGES.notFound);
				return;
			}

			if (!response.ok) {
				setFormError(MCQ_MESSAGES.somethingWentWrong);
				return;
			}

			router.push("/dashboard/mcqs");
		} catch {
			setFormError(MCQ_MESSAGES.somethingWentWrong);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} noValidate className="space-y-6">
			<FieldGroup>
				{formError ? (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{formError}
					</div>
				) : null}

				<Field data-invalid={!!errors.name}>
					<FieldLabel htmlFor="mcq-name">MCQ Name</FieldLabel>
					<Input
						id="mcq-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? "mcq-name-error" : undefined}
					/>
					<FieldError id="mcq-name-error" errors={[{ message: errors.name }]} />
				</Field>

				<Field data-invalid={!!errors.question}>
					<FieldLabel htmlFor="mcq-question">Question</FieldLabel>
					<textarea
						id="mcq-question"
						value={question}
						onChange={(event) => setQuestion(event.target.value)}
						rows={4}
						aria-invalid={!!errors.question}
						aria-describedby={
							errors.question ? "mcq-question-error" : undefined
						}
						className={cn(
							"w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30",
							errors.question &&
								"border-destructive ring-3 ring-destructive/20",
						)}
					/>
					<FieldError
						id="mcq-question-error"
						errors={[{ message: errors.question }]}
					/>
				</Field>

				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-sm font-medium">Answer Choices</h2>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={addChoice}
							disabled={choices.length >= MCQ_MAX_CHOICES || isSubmitting}
						>
							Add Choice
						</Button>
					</div>

					{errors.choices ? (
						<FieldError errors={[{ message: errors.choices }]} />
					) : null}

					{choices.map((choice, index) => (
						<div
							key={`choice-${index}`}
							className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
						>
							<label className="flex items-center gap-2 text-sm font-medium">
								<input
									type="radio"
									name="correctAnswer"
									checked={choice.isCorrect}
									onChange={() => setCorrectChoice(index)}
									aria-label={`Mark choice ${index + 1} as correct`}
								/>
								Correct
							</label>
							<div className="flex-1">
								<Input
									value={choice.choiceText}
									onChange={(event) =>
										updateChoiceText(index, event.target.value)
									}
									placeholder={`Choice ${index + 1}`}
									aria-label={`Choice ${index + 1} text`}
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => removeChoice(index)}
								disabled={choices.length <= MCQ_MIN_CHOICES || isSubmitting}
							>
								Remove
							</Button>
						</div>
					))}
				</div>

				<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Button
						type="button"
						variant="outline"
						nativeButton={false}
						render={<Link href="/dashboard/mcqs" />}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
				</div>
			</FieldGroup>
		</form>
	);
}
