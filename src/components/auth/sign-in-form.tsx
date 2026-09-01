"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	initialSignInActionState,
	type SignInActionState,
} from "@/lib/auth/actions/sign-in-state";
import { signInAction } from "@/lib/auth/actions/sign-in";

type SignInFormProps = {
	action?: (
		prevState: SignInActionState,
		formData: FormData,
	) => Promise<SignInActionState>;
};

function SignInSubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			className="w-full"
			disabled={pending}
			aria-busy={pending}
		>
			{pending ? "Signing in..." : "Sign In"}
		</Button>
	);
}

export function SignInForm({ action = signInAction }: SignInFormProps) {
	const [state, formAction] = useActionState(action, initialSignInActionState);
	const errors = state?.errors ?? {};

	return (
		<form action={formAction} noValidate className="space-y-4">
			<FieldGroup>
				{errors.form ? (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{errors.form}
					</div>
				) : null}

				{errors.credentials ? (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{errors.credentials}
					</div>
				) : null}

				<Field data-invalid={!!errors.email}>
					<FieldLabel htmlFor="email">Email Address</FieldLabel>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? "email-error" : undefined}
					/>
					<FieldError id="email-error" errors={[{ message: errors.email }]} />
				</Field>

				<Field data-invalid={!!errors.password}>
					<FieldLabel htmlFor="password">Password</FieldLabel>
					<PasswordInput
						id="password"
						name="password"
						autoComplete="current-password"
						required
						aria-invalid={!!errors.password}
						aria-describedby={errors.password ? "password-error" : undefined}
					/>
					<FieldError
						id="password-error"
						errors={[{ message: errors.password }]}
					/>
				</Field>

				<SignInSubmitButton />
			</FieldGroup>
		</form>
	);
}
