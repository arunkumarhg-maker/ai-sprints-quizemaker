/** User-facing authentication messages aligned with the Technical PRD. */
export const AUTH_MESSAGES = {
	fullNameRequired: "Full name is required.",
	fullNameTooLong: "Full name must be 100 characters or fewer.",
	emailRequired: "Email address is required.",
	emailInvalid: "Please enter a valid email address.",
	emailAlreadyRegistered:
		"An account with this email address already exists. Please sign in or use a different email.",
	passwordRequired: "Password is required.",
	passwordTooShort: "Password must be at least 8 characters long.",
	passwordMissingUppercase:
		"Password must contain at least one uppercase letter.",
	passwordMissingLowercase:
		"Password must contain at least one lowercase letter.",
	passwordMissingNumber: "Password must contain at least one number.",
	passwordMissingSpecial:
		"Password must contain at least one special character.",
	confirmPasswordRequired: "Please confirm your password.",
	passwordMismatch: "Passwords do not match.",
	invalidCredentials: "Invalid email or password. Please try again.",
	somethingWentWrong: "Something went wrong. Please try again later.",
	registrationSuccess:
		"Your account has been created successfully. Please sign in.",
	logoutSuccess: "You have been signed out successfully.",
	signInRequired: "Please sign in to continue.",
	sessionExpired: "Your session has expired. Please sign in again.",
} as const;
