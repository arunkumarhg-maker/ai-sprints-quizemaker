"use client";

import Link from "next/link";

import { McqActionsMenu } from "@/components/mcq/mcq-actions-menu";
import { Button } from "@/components/ui/button";
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
};

export function McqListTable({ mcqs }: McqListTableProps) {
	if (mcqs.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-card p-8 text-center">
				<p className="text-sm text-muted-foreground">
					You have no multiple choice questions yet.
				</p>
				<Button
					className="mt-4"
					nativeButton={false}
					render={<Link href="/dashboard/mcqs/new" />}
				>
					Create Multiple Choice Question
				</Button>
			</div>
		);
	}

	return (
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
								<McqActionsMenu mcqId={mcq.id} />
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
