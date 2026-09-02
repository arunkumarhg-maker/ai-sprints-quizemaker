"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";

type DeleteTarget = {
	id: string;
	name: string;
};

type McqDeleteDialogProps = {
	mcq: DeleteTarget | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDeleted: (mcqId: string) => void;
};

export function McqDeleteDialog({
	mcq,
	open,
	onOpenChange,
	onDeleted,
}: McqDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleDelete() {
		if (!mcq) {
			return;
		}

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(`/api/mcqs/${mcq.id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				setError(MCQ_MESSAGES.notFound);
				return;
			}

			onDeleted(mcq.id);
			onOpenChange(false);
		} catch {
			setError(MCQ_MESSAGES.somethingWentWrong);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					setError(null);
				}
				onOpenChange(nextOpen);
			}}
		>
			<DialogContent showCloseButton>
				<DialogHeader>
					<DialogTitle>Delete Multiple Choice Question</DialogTitle>
					<DialogDescription>
						{MCQ_MESSAGES.deleteConfirmation}
						{mcq ? ` (${mcq.name})` : ""}
					</DialogDescription>
				</DialogHeader>

				{error ? (
					<p role="alert" className="text-sm text-destructive">
						{error}
					</p>
				) : null}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
