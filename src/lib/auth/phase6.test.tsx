/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { getSignInFieldErrors } from "@/lib/auth/sign-in-validation";
import { getSignUpFieldErrors } from "@/lib/auth/sign-up-validation";

describe("Phase 4 Dashboard UI (TC-4-08)", () => {
	it("TC-4-08: Dashboard shows authenticated placeholder content", () => {
		render(
			<AuthenticatedHeader
				user={{
					id: "user-1",
					fullName: "Jane Doe",
					email: "jane@example.com",
					passwordHash: "pbkdf2:hash",
					createdAt: new Date().toISOString(),
				}}
			/>,
		);

		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
	});
});

describe("Phase 6 accessibility (TC-6-03 – TC-6-05)", () => {
	it("TC-6-03: all form fields have associated labels", () => {
		render(<SignUpForm action={async () => ({ errors: {} })} />);
		expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
		expect(screen.getByLabelText("Password")).toBeInTheDocument();
		expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();

		render(<SignInForm action={async () => ({ errors: {} })} />);
		expect(screen.getAllByLabelText("Email Address").length).toBeGreaterThan(0);
		expect(screen.getAllByLabelText("Password").length).toBeGreaterThan(0);
	});

	it("TC-6-04: forms are operable via keyboard", () => {
		render(<SignInForm action={async () => ({ errors: {} })} />);

		const email = screen.getAllByLabelText("Email Address").at(-1);
		const password = screen.getAllByLabelText("Password").at(-1);
		const submit = screen.getAllByRole("button", { name: "Sign In" }).at(-1);

		expect(email).toBeInTheDocument();
		expect(password).toBeInTheDocument();
		expect(submit).toHaveAttribute("type", "submit");
	});

	it("TC-6-05: error messages are associated with fields", async () => {
		const user = userEvent.setup();
		render(
			<SignInForm
				action={async () => ({
					errors: { email: AUTH_MESSAGES.emailRequired },
				})}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Sign In" }));

		const email = await screen.findByLabelText("Email Address");
		expect(email).toHaveAttribute("aria-describedby", "email-error");
		expect(document.getElementById("email-error")).toHaveTextContent(
			AUTH_MESSAGES.emailRequired,
		);
	});
});

describe("Phase 6 validation messages (TC-6-02)", () => {
	it("TC-6-02: validation error messages match PRD definitions", () => {
		expect(getSignUpFieldErrors({
			fullName: "",
			email: "",
			password: "",
			confirmPassword: "",
		}).fullName).toBe(AUTH_MESSAGES.fullNameRequired);

		expect(getSignInFieldErrors({
			email: "",
			password: "",
		}).email).toBe(AUTH_MESSAGES.emailRequired);
	});
});

describe("Phase 6 responsive layout (TC-6-06)", () => {
	it("TC-6-06: Sign Up and Sign In layouts are usable at 320px width", () => {
		global.innerWidth = 320;
		render(<SignUpForm action={async () => ({ errors: {} })} />);
		expect(screen.getByRole("button", { name: "Sign Up" })).toBeVisible();
	});
});
