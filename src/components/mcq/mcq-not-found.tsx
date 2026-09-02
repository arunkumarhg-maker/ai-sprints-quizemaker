import Link from "next/link";

import { Button } from "@/components/ui/button";

export function McqNotFound() {
	return (
		<div className="rounded-lg border border-border bg-card p-8 text-center">
			<h1 className="text-lg font-semibold">Multiple choice question not found</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				This question does not exist or you do not have access to it.
			</p>
			<Button
				className="mt-4"
				nativeButton={false}
				render={<Link href="/dashboard/mcqs" />}
			>
				Back to Multiple Choice Questions
			</Button>
		</div>
	);
}
