import Link from "next/link";

import { RegistrationSuccessMessage } from "@/components/auth/registration-success-message";
import { LogoutSuccessMessage } from "@/components/auth/logout-success-message";
import {
	SessionExpiredMessage,
	SignInRequiredMessage,
} from "@/components/auth/auth-notice";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/lib/auth/session";

type SignInPageProps = {
	searchParams: Promise<{
		registered?: string;
		loggedOut?: string;
		reason?: string;
	}>;
};

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: SignInPageProps) {
	await redirectIfAuthenticated();

	const params = await searchParams;
	const showRegistrationSuccess = params.registered === "1";
	const showLogoutSuccess = params.loggedOut === "1";
	const showSignInRequired = params.reason === "sign-in-required";
	const showSessionExpired = params.reason === "session-expired";

	return (
		<main className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Sign In</CardTitle>
					<CardDescription>
						Sign in to your Quiz Maker account.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{showRegistrationSuccess ? <RegistrationSuccessMessage /> : null}
					{showLogoutSuccess ? <LogoutSuccessMessage /> : null}
					{showSignInRequired ? <SignInRequiredMessage /> : null}
					{showSessionExpired ? <SessionExpiredMessage /> : null}
					<SignInForm />
				</CardContent>
				<CardFooter className="justify-center border-t-0 bg-transparent">
					<p className="text-sm text-muted-foreground">
						Don&apos;t have an account?{" "}
						<Link
							href="/sign-up"
							className="text-primary underline-offset-4 hover:underline"
						>
							Sign Up
						</Link>
					</p>
				</CardFooter>
			</Card>
		</main>
	);
}
