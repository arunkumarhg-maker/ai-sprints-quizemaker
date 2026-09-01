import type { SignInFieldErrors } from "@/lib/auth/schemas/sign-in";

export type SignInActionState = {
	errors: SignInFieldErrors;
};

export const initialSignInActionState: SignInActionState = {
	errors: {},
};
