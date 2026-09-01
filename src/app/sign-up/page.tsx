import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
	await redirectIfAuthenticated();
	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create Account</CardTitle>
					<CardDescription>
						Register to access Quiz Maker.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<SignUpForm />
				</CardContent>
				<CardFooter className="justify-center border-t-0 bg-transparent">
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
							Sign In
						</Link>
					</p>
				</CardFooter>
			</Card>
		</main>
	);
}
