import {
	validateConfirmPassword,
	validateEmail,
	validateFullName,
	validatePassword,
} from "@/lib/auth/validation";

export type SignUpInput = {
	fullName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export type SignUpFieldErrors = Partial<
	Record<keyof SignUpInput | "form", string>
>;

export function getSignUpFieldErrors(input: SignUpInput): SignUpFieldErrors {
	const errors: SignUpFieldErrors = {};

	const fullNameError = validateFullName(input.fullName);
	if (fullNameError) {
		errors.fullName = fullNameError;
	}

	const emailError = validateEmail(input.email);
	if (emailError) {
		errors.email = emailError;
	}

	const passwordError = validatePassword(input.password);
	if (passwordError) {
		errors.password = passwordError;
	}

	const confirmPasswordError = validateConfirmPassword(
		input.password,
		input.confirmPassword,
	);
	if (confirmPasswordError) {
		errors.confirmPassword = confirmPasswordError;
	}

	return errors;
}

export function hasSignUpFieldErrors(errors: SignUpFieldErrors): boolean {
	return Object.keys(errors).length > 0;
}
