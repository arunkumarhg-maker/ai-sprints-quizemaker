import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-4">
			<div className="space-y-2 text-center">
				<h1 className="text-4xl font-semibold tracking-tight text-foreground">
					Quiz Maker
				</h1>
				<p className="text-muted-foreground">
					Create, manage, and take quizzes.
				</p>
			</div>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button nativeButton={false} render={<Link href="/sign-in" />} size="lg">
					Sign In
				</Button>
				<Button
					nativeButton={false}
					render={<Link href="/sign-up" />}
					variant="outline"
					size="lg"
				>
					Sign Up
				</Button>
			</div>
		</main>
	);
}
