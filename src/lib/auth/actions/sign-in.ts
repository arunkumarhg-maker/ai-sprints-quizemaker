"use server";

import { redirect } from "next/navigation";

import type { SignInActionState } from "@/lib/auth/actions/sign-in-state";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	parseSignInFormData,
	signInSchema,
	zodErrorsToSignInFieldErrors,
} from "@/lib/auth/schemas/sign-in";
import { authenticateUser, establishSession } from "@/lib/auth/session";

function isNextRedirect(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string" &&
		error.digest.startsWith("NEXT_REDIRECT")
	);
}

export async function signInAction(
	_prevState: SignInActionState,
	formData: FormData,
): Promise<SignInActionState> {
	const input = parseSignInFormData(formData);
	const parsed = signInSchema.safeParse(input);

	if (!parsed.success) {
		return { errors: zodErrorsToSignInFieldErrors(parsed.error) };
	}

	try {
		const user = await authenticateUser(parsed.data.email, parsed.data.password);

		if (!user) {
			return {
				errors: { credentials: AUTH_MESSAGES.invalidCredentials },
			};
		}

		await establishSession(user.id);
		redirect("/dashboard");
	} catch (error) {
		if (isNextRedirect(error)) {
			throw error;
		}

		return { errors: { form: AUTH_MESSAGES.somethingWentWrong } };
	}
}
