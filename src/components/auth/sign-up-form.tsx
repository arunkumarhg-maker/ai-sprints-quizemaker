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
	initialSignUpActionState,
	type SignUpActionState,
} from "@/lib/auth/actions/sign-up-state";
import { signUpAction } from "@/lib/auth/actions/sign-up";

type SignUpFormProps = {
	action?: (
		prevState: SignUpActionState,
		formData: FormData,
	) => Promise<SignUpActionState>;
};

function SignUpSubmitButton() {
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			className="w-full"
			disabled={pending}
			aria-busy={pending}
		>
			{pending ? "Creating account..." : "Sign Up"}
		</Button>
	);
}

export function SignUpForm({ action = signUpAction }: SignUpFormProps) {
	const [state, formAction] = useActionState(action, initialSignUpActionState);
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

				<Field data-invalid={!!errors.fullName}>
					<FieldLabel htmlFor="fullName">Full Name</FieldLabel>
					<Input
						id="fullName"
						name="fullName"
						autoComplete="name"
						required
						aria-invalid={!!errors.fullName}
						aria-describedby={
							errors.fullName ? "fullName-error" : undefined
						}
					/>
					<FieldError id="fullName-error" errors={[{ message: errors.fullName }]} />
				</Field>

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
						autoComplete="new-password"
						required
						aria-invalid={!!errors.password}
						aria-describedby={
							errors.password ? "password-error" : undefined
						}
					/>
					<FieldError
						id="password-error"
						errors={[{ message: errors.password }]}
					/>
				</Field>

				<Field data-invalid={!!errors.confirmPassword}>
					<FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
					<PasswordInput
						id="confirmPassword"
						name="confirmPassword"
						autoComplete="new-password"
						required
						aria-invalid={!!errors.confirmPassword}
						aria-describedby={
							errors.confirmPassword
								? "confirmPassword-error"
								: undefined
						}
					/>
					<FieldError
						id="confirmPassword-error"
						errors={[{ message: errors.confirmPassword }]}
					/>
				</Field>

				<SignUpSubmitButton />
			</FieldGroup>
		</form>
	);
}
