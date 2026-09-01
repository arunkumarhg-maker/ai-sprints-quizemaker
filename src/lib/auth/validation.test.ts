import { describe, expect, it } from "vitest";

import { AUTH_MESSAGES } from "@/lib/auth/messages";
import {
	validateConfirmPassword,
	validateEmail,
	validateFullName,
	validatePassword,
} from "@/lib/auth/validation";

describe("Phase 1 validation (TC-1-01 – TC-1-11)", () => {
	it("TC-1-01: valid email format is accepted", () => {
		expect(validateEmail("user@example.com")).toBeNull();
	});

	it("TC-1-02: invalid email format is rejected", () => {
		expect(validateEmail("not-an-email")).toBe(AUTH_MESSAGES.emailInvalid);
		expect(validateEmail("@missing.com")).toBe(AUTH_MESSAGES.emailInvalid);
	});

	it("TC-1-03: password missing uppercase is rejected", () => {
		expect(validatePassword("secure1!pass")).toBe(
			AUTH_MESSAGES.passwordMissingUppercase,
		);
	});

	it("TC-1-04: password missing lowercase is rejected", () => {
		expect(validatePassword("SECURE1!PASS")).toBe(
			AUTH_MESSAGES.passwordMissingLowercase,
		);
	});

	it("TC-1-05: password missing number is rejected", () => {
		expect(validatePassword("Secure!pass")).toBe(
			AUTH_MESSAGES.passwordMissingNumber,
		);
	});

	it("TC-1-06: password missing special character is rejected", () => {
		expect(validatePassword("Secure1pass")).toBe(
			AUTH_MESSAGES.passwordMissingSpecial,
		);
	});

	it("TC-1-07: password shorter than 8 characters is rejected", () => {
		expect(validatePassword("Sec1!a")).toBe(AUTH_MESSAGES.passwordTooShort);
	});

	it("TC-1-08: valid password meeting all rules is accepted", () => {
		expect(validatePassword("Secure1!pass")).toBeNull();
	});

	it("TC-1-09: confirm password mismatch is rejected", () => {
		expect(validateConfirmPassword("Secure1!pass", "Different1!")).toBe(
			AUTH_MESSAGES.passwordMismatch,
		);
	});

	it("TC-1-10: confirm password match is accepted", () => {
		expect(validateConfirmPassword("Secure1!pass", "Secure1!pass")).toBeNull();
	});

	it("TC-1-11: full name empty or whitespace-only is rejected", () => {
		expect(validateFullName("")).toBe(AUTH_MESSAGES.fullNameRequired);
		expect(validateFullName("   ")).toBe(AUTH_MESSAGES.fullNameRequired);
	});
});
