/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { LogoutSuccessMessage } from "@/components/auth/logout-success-message";
import { RegistrationSuccessMessage } from "@/components/auth/registration-success-message";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import type { SignInActionState } from "@/lib/auth/actions/sign-in-state";
import {
	parseSignInFormData,
	signInSchema,
	zodErrorsToSignInFieldErrors,
} from "@/lib/auth/schemas/sign-in";

async function validateOnlySignInAction(
	_prevState: SignInActionState,
	formData: FormData,
): Promise<SignInActionState> {
	const input = parseSignInFormData(formData);
	const parsed = signInSchema.safeParse(input);

	if (!parsed.success) {
		return { errors: zodErrorsToSignInFieldErrors(parsed.error) };
	}

	return { errors: {} };
}

async function slowValidateSignInAction(
	prevState: SignInActionState,
	formData: FormData,
): Promise<SignInActionState> {
	await new Promise((resolve) => setTimeout(resolve, 50));
	return validateOnlySignInAction(prevState, formData);
}

describe("Phase 3 Sign In UI (TC-3-01 – TC-3-03, TC-3-09)", () => {
	it("TC-3-01: Sign In page renders required fields", () => {
		render(<SignInForm action={validateOnlySignInAction} />);

		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
	});

	it("TC-3-02: submitting empty Sign In form shows required errors", async () => {
		const user = userEvent.setup();
		render(<SignInForm action={validateOnlySignInAction} />);

		await user.click(screen.getByRole("button", { name: "Sign In" }));

		expect(
			await screen.findByText(AUTH_MESSAGES.emailRequired),
		).toBeInTheDocument();
		expect(screen.getByText(AUTH_MESSAGES.passwordRequired)).toBeInTheDocument();
	});

	it("TC-3-03: invalid email format on Sign In shows error", async () => {
		const user = userEvent.setup();
		render(<SignInForm action={validateOnlySignInAction} />);

		await user.type(screen.getByLabelText("Email Address"), "not-an-email");
		await user.type(screen.getByLabelText("Password"), "Secure1!pass");
		await user.click(screen.getByRole("button", { name: "Sign In" }));

		expect(
			await screen.findByText(AUTH_MESSAGES.emailInvalid),
		).toBeInTheDocument();
	});

	it("TC-3-09: Sign In shows loading state during submission", async () => {
		const user = userEvent.setup();
		render(<SignInForm action={slowValidateSignInAction} />);

		await user.type(screen.getByLabelText("Email Address"), "jane@example.com");
		await user.type(screen.getByLabelText("Password"), "Secure1!pass");

		const submitButton = screen.getByRole("button", { name: "Sign In" });
		await user.click(submitButton);

		expect(submitButton).toHaveAttribute("aria-busy", "true");
		expect(submitButton).toHaveTextContent("Signing in...");
		expect(submitButton).toBeDisabled();

		await waitFor(() => {
			expect(submitButton).toHaveAttribute("aria-busy", "false");
		});
	});
});

describe("Phase 3 success messages (TC-3-08)", () => {
	it("TC-3-08: registration success message visible on Sign In after redirect", () => {
		render(<RegistrationSuccessMessage />);
		expect(
			screen.getByText(AUTH_MESSAGES.registrationSuccess),
		).toBeInTheDocument();
	});
});

describe("Phase 5 logout success message (TC-5-03)", () => {
	it("TC-5-03: logout success message appears on Sign In", () => {
		render(<LogoutSuccessMessage />);
		expect(screen.getByText(AUTH_MESSAGES.logoutSuccess)).toBeInTheDocument();
	});
});
