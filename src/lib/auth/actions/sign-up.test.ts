import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	initialSignUpActionState,
} from "@/lib/auth/actions/sign-up-state";
import { signUpAction } from "@/lib/auth/actions/sign-up";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	createMockD1Database,
	getMockSessionCount,
} from "@/lib/auth/test/mock-d1";
import { findUserByEmail } from "@/lib/auth/users";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		const error = new Error("NEXT_REDIRECT");
		(error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url}`;
		throw error;
	}),
}));

import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";

const VALID_SIGN_UP = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
	confirmPassword: "Secure1!pass",
};

function createFormData(input: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(input)) {
		formData.set(key, value);
	}
	return formData;
}

describe("Phase 2 Sign Up action (TC-2-06 – TC-2-08, TC-2-10)", () => {
	let db: D1Database;

	beforeEach(() => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		vi.mocked(redirect).mockClear();
	});

	it("TC-2-06: duplicate email on Sign Up shows error", async () => {
		try {
			await signUpAction(initialSignUpActionState, createFormData(VALID_SIGN_UP));
		} catch {
			// redirect throws on successful registration
		}

		const duplicate = await signUpAction(
			initialSignUpActionState,
			createFormData({
				...VALID_SIGN_UP,
				email: "Jane@Example.com",
			}),
		);

		expect(duplicate.errors.email).toBe(AUTH_MESSAGES.emailAlreadyRegistered);
		expect(redirect).toHaveBeenCalledTimes(1);
	});

	it("TC-2-07: valid Sign Up creates user account", async () => {
		try {
			await signUpAction(
				initialSignUpActionState,
				createFormData(VALID_SIGN_UP),
			);
		} catch {
			// redirect throws
		}

		const user = await findUserByEmail(db, VALID_SIGN_UP.email);
		expect(user).not.toBeNull();
		expect(user?.fullName).toBe(VALID_SIGN_UP.fullName);
	});

	it("TC-2-08: successful Sign Up redirects to Sign In", async () => {
		await expect(
			signUpAction(initialSignUpActionState, createFormData(VALID_SIGN_UP)),
		).rejects.toThrow("NEXT_REDIRECT");

		expect(redirect).toHaveBeenCalledWith("/sign-in?registered=1");
	});

	it("TC-2-10: user is not authenticated after Sign Up", async () => {
		try {
			await signUpAction(
				initialSignUpActionState,
				createFormData(VALID_SIGN_UP),
			);
		} catch {
			// redirect throws
		}

		expect(getMockSessionCount(db)).toBe(0);
	});
});
