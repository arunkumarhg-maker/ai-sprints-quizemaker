import type { SignUpFieldErrors } from "@/lib/auth/schemas/sign-up";

export type SignUpActionState = {
	errors: SignUpFieldErrors;
};

export const initialSignUpActionState: SignUpActionState = {
	errors: {},
};
