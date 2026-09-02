import Link from "next/link";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const session = await requireAuth();

	return (
		<main className="mx-auto w-full max-w-5xl p-4">
			<Card>
				<CardHeader>
					<CardTitle>Welcome, {session.user.fullName}</CardTitle>
					<CardDescription>
						You are signed in to Quiz Maker.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						Create and manage multiple choice questions for your quizzes.
					</p>
					<Button nativeButton={false} render={<Link href="/dashboard/mcqs" />}>
						Manage Multiple Choice Questions
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
