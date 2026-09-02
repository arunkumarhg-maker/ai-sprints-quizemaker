import Link from "next/link";

import { McqListTable } from "@/components/mcq/mcq-list-table";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";
import { listMcqsByUser } from "@/lib/mcq/mcqs";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const session = await requireAuth();
	const db = await getDb();
	const mcqs = await listMcqsByUser(db, session.userId);

	return (
		<main className="mx-auto w-full max-w-5xl p-4">
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Welcome, {session.user.fullName}
					</h1>
					<p className="text-sm text-muted-foreground">
						You are signed in to Quiz Maker.
					</p>
				</div>
				<Button
					nativeButton={false}
					render={<Link href="/dashboard/mcqs/new" />}
				>
					Create Multiple Choice Question
				</Button>
			</div>
			<section className="space-y-4">
				<div>
					<h2 className="text-lg font-semibold tracking-tight">
						Multiple Choice Questions
					</h2>
					<p className="text-sm text-muted-foreground">
						Create and manage multiple choice questions for your quizzes.
					</p>
				</div>
				<McqListTable mcqs={mcqs} />
			</section>
		</main>
	);
}
