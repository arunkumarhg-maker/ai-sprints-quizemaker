import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { FULL_NAME_MAX_LENGTH } from "@/lib/auth/config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_PATTERN = /[!@#$%^&*()_+\-=[\]{}|;:'",.<>/?\\`~]/;

export function validateEmail(email: string): string | null {
	if (!email.trim()) {
		return AUTH_MESSAGES.emailRequired;
	}
	if (!EMAIL_PATTERN.test(email.trim())) {
		return AUTH_MESSAGES.emailInvalid;
	}
	return null;
}

export function validatePassword(password: string): string | null {
	if (!password) {
		return AUTH_MESSAGES.passwordRequired;
	}
	if (password.length < 8) {
		return AUTH_MESSAGES.passwordTooShort;
	}
	if (!/[A-Z]/.test(password)) {
		return AUTH_MESSAGES.passwordMissingUppercase;
	}
	if (!/[a-z]/.test(password)) {
		return AUTH_MESSAGES.passwordMissingLowercase;
	}
	if (!/[0-9]/.test(password)) {
		return AUTH_MESSAGES.passwordMissingNumber;
	}
	if (!SPECIAL_CHAR_PATTERN.test(password)) {
		return AUTH_MESSAGES.passwordMissingSpecial;
	}
	return null;
}

export function validateConfirmPassword(
	password: string,
	confirmPassword: string,
): string | null {
	if (!confirmPassword) {
		return AUTH_MESSAGES.confirmPasswordRequired;
	}
	if (password !== confirmPassword) {
		return AUTH_MESSAGES.passwordMismatch;
	}
	return null;
}

export function validateFullName(fullName: string): string | null {
	if (!fullName.trim()) {
		return AUTH_MESSAGES.fullNameRequired;
	}
	if (fullName.trim().length > FULL_NAME_MAX_LENGTH) {
		return AUTH_MESSAGES.fullNameTooLong;
	}
	return null;
}

export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}
