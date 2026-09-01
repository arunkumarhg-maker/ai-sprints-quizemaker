"use server";

import { redirect } from "next/navigation";

import type { SignUpActionState } from "@/lib/auth/actions/sign-up-state";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	parseSignUpFormData,
	signUpSchema,
	zodErrorsToFieldErrors,
} from "@/lib/auth/schemas/sign-up";
import { createUser } from "@/lib/auth/users";
import { getDb } from "@/lib/db";

function isNextRedirect(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"digest" in error &&
		typeof error.digest === "string" &&
		error.digest.startsWith("NEXT_REDIRECT")
	);
}

export async function signUpAction(
	_prevState: SignUpActionState,
	formData: FormData,
): Promise<SignUpActionState> {
	const input = parseSignUpFormData(formData);
	const parsed = signUpSchema.safeParse(input);

	if (!parsed.success) {
		return { errors: zodErrorsToFieldErrors(parsed.error) };
	}

	try {
		const db = await getDb();
		const result = await createUser(db, parsed.data);

		if (!result.ok) {
			if (result.error === "duplicate_email") {
				return {
					errors: { email: AUTH_MESSAGES.emailAlreadyRegistered },
				};
			}

			return { errors: { form: AUTH_MESSAGES.somethingWentWrong } };
		}

		redirect("/sign-in?registered=1");
	} catch (error) {
		if (isNextRedirect(error)) {
			throw error;
		}

		return { errors: { form: AUTH_MESSAGES.somethingWentWrong } };
	}
}
