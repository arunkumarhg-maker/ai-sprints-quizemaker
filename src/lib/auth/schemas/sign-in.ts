import { z } from "zod";

import {
	getSignInFieldErrors,
	type SignInFieldErrors,
	type SignInInput,
} from "@/lib/auth/sign-in-validation";

export type { SignInFieldErrors, SignInInput };

export const signInSchema = z
	.object({
		email: z.string(),
		password: z.string(),
	})
	.superRefine((data, ctx) => {
		const fieldErrors = getSignInFieldErrors(data);
		for (const [field, message] of Object.entries(fieldErrors)) {
			if (message && (field === "email" || field === "password")) {
				ctx.addIssue({
					code: "custom",
					message,
					path: [field],
				});
			}
		}
	});

export function zodErrorsToSignInFieldErrors(
	error: z.ZodError,
): SignInFieldErrors {
	const fieldErrors: SignInFieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (field === "email" || field === "password") {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
}

export function parseSignInFormData(formData: FormData): SignInInput {
	return {
		email: formData.get("email")?.toString() ?? "",
		password: formData.get("password")?.toString() ?? "",
	};
}
