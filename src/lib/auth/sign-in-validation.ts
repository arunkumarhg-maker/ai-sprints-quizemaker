import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { validateEmail } from "@/lib/auth/validation";

export type SignInInput = {
	email: string;
	password: string;
};

export type SignInFieldErrors = Partial<
	Record<keyof SignInInput | "form" | "credentials", string>
>;

export function getSignInFieldErrors(input: SignInInput): SignInFieldErrors {
	const errors: SignInFieldErrors = {};

	if (!input.email.trim()) {
		errors.email = AUTH_MESSAGES.emailRequired;
	} else {
		const emailError = validateEmail(input.email);
		if (emailError) {
			errors.email = emailError;
		}
	}

	if (!input.password) {
		errors.password = AUTH_MESSAGES.passwordRequired;
	}

	return errors;
}

export function hasSignInFieldErrors(errors: SignInFieldErrors): boolean {
	return Object.keys(errors).length > 0;
}
