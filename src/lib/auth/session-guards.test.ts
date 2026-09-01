import { beforeEach, describe, expect, it, vi } from "vitest";

import { logoutAction } from "@/lib/auth/actions/logout";
import { initialSignInActionState } from "@/lib/auth/actions/sign-in-state";
import { signInAction } from "@/lib/auth/actions/sign-in";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { redirectIfAuthenticated, requireAuthOrExpired } from "@/lib/auth/session";
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

describe("Phase 3 redirect guard (TC-3-07)", () => {
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

	it("TC-3-07: authenticated user visiting Sign In is redirected to Dashboard", async () => {
		await expect(redirectIfAuthenticated()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});
});

describe("Phase 4 protected routes (TC-4-01, TC-4-02, TC-4-07)", () => {
	let db: D1Database;

	beforeEach(() => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		mockCookieStore.value = undefined;
		vi.mocked(redirect).mockClear();
	});

	it("TC-4-01: unauthenticated user accessing Dashboard is redirected to Sign In", async () => {
		await expect(requireAuthOrExpired()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/sign-in?reason=sign-in-required");
	});

	it("TC-4-02: unauthenticated direct URL to Dashboard does not render protected content", async () => {
		await expect(requireAuthOrExpired()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/sign-in?reason=sign-in-required");
	});

	it("TC-4-07: expired or invalid session redirects to Sign In", async () => {
		mockCookieStore.value = crypto.randomUUID();

		await expect(requireAuthOrExpired()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/sign-in?reason=session-expired");
	});
});

describe("Phase 4 authenticated sign-up guard (TC-4-06)", () => {
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

	it("TC-4-06: authenticated user visiting Sign Up is redirected to Dashboard", async () => {
		await expect(redirectIfAuthenticated()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/dashboard");
	});
});

describe("Phase 5 logout redirect (TC-5-02, TC-5-04)", () => {
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

	it("TC-5-02: logout redirects user to Sign In", async () => {
		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/sign-in?loggedOut=1");
	});

	it("TC-5-04: Dashboard is inaccessible immediately after logout", async () => {
		await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");

		await expect(requireAuthOrExpired()).rejects.toThrow("NEXT_REDIRECT");
		expect(redirect).toHaveBeenCalledWith("/sign-in?reason=sign-in-required");
	});
});

describe("Phase 4 authenticated dashboard access (TC-4-03)", () => {
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

	it("TC-4-03: authenticated user with valid session can access Dashboard", async () => {
		const session = await requireAuthOrExpired();
		expect(session.authenticated).toBe(true);
		expect(session.user.fullName).toBe(VALID_USER.fullName);
	});
});
