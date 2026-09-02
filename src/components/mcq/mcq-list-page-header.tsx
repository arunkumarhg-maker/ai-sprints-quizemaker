import Link from "next/link";

import { Button } from "@/components/ui/button";

export function McqListPageHeader() {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Multiple Choice Questions
				</h1>
				<p className="text-sm text-muted-foreground">
					Create and manage your multiple choice questions.
				</p>
			</div>
			<Button nativeButton={false} render={<Link href="/dashboard/mcqs/new" />}>
				Create Multiple Choice Question
			</Button>
		</div>
	);
}
