import { z } from "zod";

import {
	getSignUpFieldErrors,
	type SignUpFieldErrors,
	type SignUpInput,
} from "@/lib/auth/sign-up-validation";

export type { SignUpFieldErrors, SignUpInput };

export const signUpSchema = z
	.object({
		fullName: z.string(),
		email: z.string(),
		password: z.string(),
		confirmPassword: z.string(),
	})
	.superRefine((data, ctx) => {
		const fieldErrors = getSignUpFieldErrors(data);
		for (const [field, message] of Object.entries(fieldErrors)) {
			if (message) {
				ctx.addIssue({
					code: "custom",
					message,
					path: [field],
				});
			}
		}
	});

export function zodErrorsToFieldErrors(
	error: z.ZodError,
): SignUpFieldErrors {
	const fieldErrors: SignUpFieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (
			field === "fullName" ||
			field === "email" ||
			field === "password" ||
			field === "confirmPassword"
		) {
			fieldErrors[field] = issue.message;
		}
	}
	return fieldErrors;
}

export function parseSignUpFormData(formData: FormData): SignUpInput {
	return {
		fullName: formData.get("fullName")?.toString() ?? "",
		email: formData.get("email")?.toString() ?? "",
		password: formData.get("password")?.toString() ?? "",
		confirmPassword: formData.get("confirmPassword")?.toString() ?? "",
	};
}
