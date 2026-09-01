import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	initialSignInActionState,
} from "@/lib/auth/actions/sign-in-state";
import { signInAction } from "@/lib/auth/actions/sign-in";
import { AUTH_MESSAGES } from "@/lib/auth/messages";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { createMockD1Database } from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";

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

const mockCookieStore = {
	value: undefined as string | undefined,
	get: vi.fn((name: string) =>
		name === SESSION_COOKIE_NAME && mockCookieStore.value
			? { name, value: mockCookieStore.value }
			: undefined,
	),
	set: vi.fn((name: string, value: string) => {
		if (name === SESSION_COOKIE_NAME) {
			mockCookieStore.value = value;
		}
	}),
	delete: vi.fn((name: string) => {
		if (name === SESSION_COOKIE_NAME) {
			mockCookieStore.value = undefined;
		}
	}),
};

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => mockCookieStore),
}));

import { getDb } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCurrentSession, terminateSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions/logout";

const VALID_USER = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
};

function createFormData(input: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(input)) {
		formData.set(key, value);
	}
	return formData;
}

describe("Phase 3 Sign In action (TC-3-04 – TC-3-06)", () => {
	let db: D1Database;

	beforeEach(async () => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		mockCookieStore.value = undefined;
		mockCookieStore.get.mockClear();
		mockCookieStore.set.mockClear();
		mockCookieStore.delete.mockClear();
		vi.mocked(redirect).mockClear();

		await createUser(db, {
			...VALID_USER,
			confirmPassword: VALID_USER.password,
		});
	});

	it("TC-3-04: wrong email or password shows generic error", async () => {
		const result = await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: "WrongPass1!",
			}),
		);

		expect(result.errors.credentials).toBe(AUTH_MESSAGES.invalidCredentials);
		expect(redirect).not.toHaveBeenCalled();
	});

	it("TC-3-05: valid credentials establish authenticated session", async () => {
		try {
			await signInAction(
				initialSignInActionState,
				createFormData({
					email: VALID_USER.email,
					password: VALID_USER.password,
				}),
			);
		} catch {
			// redirect throws
		}

		expect(mockCookieStore.set).toHaveBeenCalled();
		const session = await getCurrentSession();
		expect(session.authenticated).toBe(true);
	});

	it("TC-3-06: successful Sign In redirects to Dashboard", async () => {
		await expect(
			signInAction(
				initialSignInActionState,
				createFormData({
					email: VALID_USER.email,
					password: VALID_USER.password,
				}),
			),
		).rejects.toThrow("NEXT_REDIRECT");

		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});
});

describe("Phase 5 Logout (TC-5-01, TC-5-05)", () => {
	let db: D1Database;

	beforeEach(async () => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		mockCookieStore.value = undefined;
		vi.mocked(redirect).mockClear();

		await createUser(db, {
			...VALID_USER,
			confirmPassword: VALID_USER.password,
		});

		await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: VALID_USER.password,
			}),
		).catch(() => undefined);
	});

	it("TC-5-01: logout invalidates the active session", async () => {
		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

		const session = await getCurrentSession();
		expect(session.authenticated).toBe(false);
	});

	it("TC-5-05: browser refresh after logout does not restore session", async () => {
		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");
		await terminateSession();

		const session = await getCurrentSession();
		expect(session.authenticated).toBe(false);
		expect(mockCookieStore.value).toBeUndefined();
	});
});

describe("Phase 4 session persistence (TC-4-04, TC-4-05)", () => {
	let db: D1Database;

	beforeEach(async () => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		mockCookieStore.value = undefined;

		await createUser(db, {
			...VALID_USER,
			confirmPassword: VALID_USER.password,
		});

		await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: VALID_USER.password,
			}),
		).catch(() => undefined);
	});

	it("TC-4-04: session persists across in-app navigation", async () => {
		const first = await getCurrentSession();
		const second = await getCurrentSession();

		expect(first.authenticated).toBe(true);
		expect(second.authenticated).toBe(true);
		if (first.authenticated && second.authenticated) {
			expect(first.session.id).toBe(second.session.id);
		}
	});

	it("TC-4-05: session persists across browser refresh", async () => {
		const cookieValue = mockCookieStore.value;
		expect(cookieValue).toBeTruthy();

		const session = await getCurrentSession();
		expect(session.authenticated).toBe(true);
		expect(mockCookieStore.value).toBe(cookieValue);
	});
});

describe("Phase 6 full authentication journey (TC-6-01)", () => {
	let db: D1Database;

	beforeEach(() => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		mockCookieStore.value = undefined;
		vi.mocked(redirect).mockClear();
	});

	it("TC-6-01: full authentication journey succeeds", async () => {
		await createUser(db, {
			...VALID_USER,
			confirmPassword: VALID_USER.password,
		});

		await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: VALID_USER.password,
			}),
		).catch(() => undefined);

		const authenticated = await getCurrentSession();
		expect(authenticated.authenticated).toBe(true);

		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

		const blocked = await getCurrentSession();
		expect(blocked.authenticated).toBe(false);
	});
});

describe("Phase 6 error handling (TC-6-07 – TC-6-08)", () => {
	it("TC-6-07: system errors show generic user-friendly message", async () => {
		vi.mocked(getDb).mockRejectedValue(new Error("database unavailable"));

		const result = await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: VALID_USER.password,
			}),
		);

		expect(result.errors.form).toBe(AUTH_MESSAGES.somethingWentWrong);
	});

	it("TC-6-08: authentication errors do not expose internal details", async () => {
		vi.mocked(getDb).mockRejectedValue(new Error("database unavailable"));

		const result = await signInAction(
			initialSignInActionState,
			createFormData({
				email: VALID_USER.email,
				password: VALID_USER.password,
			}),
		);

		expect(JSON.stringify(result.errors)).not.toContain("database unavailable");
	});
});
