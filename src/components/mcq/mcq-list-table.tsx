"use client";

import { useState } from "react";

import { McqActionsMenu } from "@/components/mcq/mcq-actions-menu";
import { McqDeleteDialog } from "@/components/mcq/mcq-delete-dialog";
import { McqPreviewDialog } from "@/components/mcq/mcq-preview-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	formatMcqCreatedAt,
	MCQ_QUESTION_TABLE_MAX_LENGTH,
	truncateText,
} from "@/lib/mcq/format";
import type { McqListItem } from "@/lib/mcq/types";

type McqListTableProps = {
	mcqs: McqListItem[];
	/** Opens the row actions menu by default (jsdom dropdown tests). */
	actionsMenuDefaultOpen?: boolean;
};

export function McqListTable({
	mcqs: initialMcqs,
	actionsMenuDefaultOpen = false,
}: McqListTableProps) {
	const [deletedMcqIds, setDeletedMcqIds] = useState<string[]>([]);
	const [previewMcqId, setPreviewMcqId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<McqListItem | null>(null);
	const mcqs = initialMcqs.filter((mcq) => !deletedMcqIds.includes(mcq.id));

	if (mcqs.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-card p-8 text-center">
				<p className="text-sm text-muted-foreground">
					You have no multiple choice questions yet.
				</p>
			</div>
		);
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Question</TableHead>
						<TableHead>Created</TableHead>
						<TableHead className="w-[70px] text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{mcqs.map((mcq) => {
						const truncatedQuestion = truncateText(
							mcq.question,
							MCQ_QUESTION_TABLE_MAX_LENGTH,
						);

						return (
							<TableRow key={mcq.id}>
								<TableCell className="font-medium">{mcq.name}</TableCell>
								<TableCell
									className="max-w-md whitespace-normal"
									title={mcq.question}
								>
									{truncatedQuestion}
								</TableCell>
								<TableCell>{formatMcqCreatedAt(mcq.createdAt)}</TableCell>
								<TableCell className="text-right">
									<McqActionsMenu
										mcqId={mcq.id}
										defaultOpen={actionsMenuDefaultOpen}
										onPreview={() => setPreviewMcqId(mcq.id)}
										onDelete={() => setDeleteTarget(mcq)}
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			<McqPreviewDialog
				mcqId={previewMcqId}
				open={previewMcqId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewMcqId(null);
					}
				}}
			/>

			<McqDeleteDialog
				mcq={
					deleteTarget
						? { id: deleteTarget.id, name: deleteTarget.name }
						: null
				}
				open={deleteTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null);
					}
				}}
				onDeleted={(mcqId) => {
					setDeletedMcqIds((current) => [...current, mcqId]);
				}}
			/>
		</>
	);
}
