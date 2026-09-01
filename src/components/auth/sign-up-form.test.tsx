/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RegistrationSuccessMessage } from "@/components/auth/registration-success-message";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import type { SignUpActionState } from "@/lib/auth/actions/sign-up-state";
import {
	parseSignUpFormData,
	signUpSchema,
	zodErrorsToFieldErrors,
} from "@/lib/auth/schemas/sign-up";

async function validateOnlySignUpAction(
	_prevState: SignUpActionState,
	formData: FormData,
): Promise<SignUpActionState> {
	const input = parseSignUpFormData(formData);
	const parsed = signUpSchema.safeParse(input);

	if (!parsed.success) {
		return { errors: zodErrorsToFieldErrors(parsed.error) };
	}

	return { errors: {} };
}

async function slowValidateSignUpAction(
	prevState: SignUpActionState,
	formData: FormData,
): Promise<SignUpActionState> {
	await new Promise((resolve) => setTimeout(resolve, 50));
	return validateOnlySignUpAction(prevState, formData);
}

describe("Phase 2 Sign Up UI (TC-2-01 – TC-2-05, TC-2-11)", () => {
	it("TC-2-01: Sign Up page renders required fields", () => {
		render(<SignUpForm action={validateOnlySignUpAction} />);

		expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
	});

	it("TC-2-02: submitting empty Sign Up form shows required errors", async () => {
		const user = userEvent.setup();
		render(<SignUpForm action={validateOnlySignUpAction} />);

		await user.click(screen.getByRole("button", { name: "Sign Up" }));

		expect(await screen.findByText(AUTH_MESSAGES.fullNameRequired)).toBeInTheDocument();
		expect(screen.getByText(AUTH_MESSAGES.emailRequired)).toBeInTheDocument();
		expect(screen.getByText(AUTH_MESSAGES.passwordRequired)).toBeInTheDocument();
		expect(screen.getByText(AUTH_MESSAGES.confirmPasswordRequired)).toBeInTheDocument();
	});

	it("TC-2-03: invalid email on Sign Up shows format error", async () => {
		const user = userEvent.setup();
		render(<SignUpForm action={validateOnlySignUpAction} />);

		await user.type(screen.getByLabelText("Full Name"), "Jane Doe");
		await user.type(screen.getByLabelText("Email Address"), "not-an-email");
		await user.type(screen.getByLabelText("Password"), "Secure1!pass");
		await user.type(screen.getByLabelText("Confirm Password"), "Secure1!pass");
		await user.click(screen.getByRole("button", { name: "Sign Up" }));

		expect(
			await screen.findByText(AUTH_MESSAGES.emailInvalid),
		).toBeInTheDocument();
	});

	it("TC-2-04: weak password on Sign Up shows specific complexity error", async () => {
		const user = userEvent.setup();
		render(<SignUpForm action={validateOnlySignUpAction} />);

		await user.type(screen.getByLabelText("Full Name"), "Jane Doe");
		await user.type(screen.getByLabelText("Email Address"), "jane@example.com");
		await user.type(screen.getByLabelText("Password"), "secure1!pass");
		await user.type(screen.getByLabelText("Confirm Password"), "secure1!pass");
		await user.click(screen.getByRole("button", { name: "Sign Up" }));

		expect(
			await screen.findByText(AUTH_MESSAGES.passwordMissingUppercase),
		).toBeInTheDocument();
	});

	it("TC-2-05: mismatched Confirm Password shows error", async () => {
		const user = userEvent.setup();
		render(<SignUpForm action={validateOnlySignUpAction} />);

		await user.type(screen.getByLabelText("Full Name"), "Jane Doe");
		await user.type(screen.getByLabelText("Email Address"), "jane@example.com");
		await user.type(screen.getByLabelText("Password"), "Secure1!pass");
		await user.type(screen.getByLabelText("Confirm Password"), "Different1!");
		await user.click(screen.getByRole("button", { name: "Sign Up" }));

		expect(
			await screen.findByText(AUTH_MESSAGES.passwordMismatch),
		).toBeInTheDocument();
	});

	it("TC-2-11: Sign Up shows loading state during submission", async () => {
		const user = userEvent.setup();
		render(<SignUpForm action={slowValidateSignUpAction} />);

		await user.type(screen.getByLabelText("Full Name"), "Jane Doe");
		await user.type(screen.getByLabelText("Email Address"), "jane@example.com");
		await user.type(screen.getByLabelText("Password"), "Secure1!pass");
		await user.type(screen.getByLabelText("Confirm Password"), "Secure1!pass");

		const submitButton = screen.getByRole("button", { name: "Sign Up" });
		await user.click(submitButton);

		expect(submitButton).toHaveAttribute("aria-busy", "true");
		expect(submitButton).toHaveTextContent("Creating account...");
		expect(submitButton).toBeDisabled();

		await waitFor(() => {
			expect(submitButton).toHaveAttribute("aria-busy", "false");
		});
	});
});

describe("Phase 2 registration success message (TC-2-09)", () => {
	it("TC-2-09: registration success message appears on Sign In", () => {
		render(<RegistrationSuccessMessage />);

		expect(
			screen.getByText(AUTH_MESSAGES.registrationSuccess),
		).toBeInTheDocument();
	});
});
