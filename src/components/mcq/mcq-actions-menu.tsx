"use client";

import Link from "next/link";
import { MoreVerticalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type McqActionsMenuProps = {
	mcqId: string;
	defaultOpen?: boolean;
	onPreview?: () => void;
	onDelete?: () => void;
};

export function McqActionsMenu({
	mcqId,
	defaultOpen = false,
	onPreview,
	onDelete,
}: McqActionsMenuProps) {
	return (
		<DropdownMenu defaultOpen={defaultOpen}>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Open actions menu"
					/>
				}
			>
				<MoreVerticalIcon />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					render={<Link href={`/dashboard/mcqs/${mcqId}/edit`} />}
				>
					Edit
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onPreview}>Preview</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
