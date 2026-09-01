export {
	initialSignInActionState,
	type SignInActionState,
} from "@/lib/auth/actions/sign-in-state";
export { signInAction } from "@/lib/auth/actions/sign-in";
export { logoutAction } from "@/lib/auth/actions/logout";
export {
	authenticateUser,
	establishSession,
	getCurrentSession,
	redirectIfAuthenticated,
	requireAuth,
	requireAuthOrExpired,
	terminateSession,
} from "@/lib/auth/session";
export {
	clearSessionCookie,
	getSessionCookie,
	setSessionCookie,
	SESSION_COOKIE_NAME,
} from "@/lib/auth/session-cookie";
export { getSignInFieldErrors, hasSignInFieldErrors } from "@/lib/auth/sign-in-validation";
export type { SignInFieldErrors, SignInInput } from "@/lib/auth/sign-in-validation";
export { findUserById, verifyUserCredentials } from "@/lib/auth/users";
export { AUTH_MESSAGES } from "@/lib/auth/messages";
export {
	FULL_NAME_MAX_LENGTH,
	PASSWORD_HASH_ITERATIONS,
	SESSION_MAX_AGE_MS,
} from "@/lib/auth/config";
export { hashPassword, isPasswordHashed, verifyPassword } from "@/lib/auth/password";
export {
	createSession,
	invalidateSession,
	validateSession,
} from "@/lib/auth/sessions";
export type {
	CreateUserInput,
	CreateUserResult,
	Session,
	SessionValidationResult,
	User,
} from "@/lib/auth/types";
export { createUser, emailExists, findUserByEmail } from "@/lib/auth/users";
export { getSignUpFieldErrors, hasSignUpFieldErrors } from "@/lib/auth/sign-up-validation";
export type { SignUpFieldErrors, SignUpInput } from "@/lib/auth/sign-up-validation";
export {
	initialSignUpActionState,
	type SignUpActionState,
} from "@/lib/auth/actions/sign-up-state";
export { signUpAction } from "@/lib/auth/actions/sign-up";
export {
	normalizeEmail,
	validateConfirmPassword,
	validateEmail,
	validateFullName,
	validatePassword,
} from "@/lib/auth/validation";
