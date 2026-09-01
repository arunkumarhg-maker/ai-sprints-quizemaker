import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Future quiz creation, management, and attempt features will
						appear here.
					</p>
				</CardContent>
			</Card>
		</main>
	);
}
