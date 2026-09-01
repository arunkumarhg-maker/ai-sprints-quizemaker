import { beforeEach, describe, expect, it } from "vitest";

import { isPasswordHashed, verifyPassword } from "@/lib/auth/password";
import {
	createSession,
	invalidateSession,
	validateSession,
} from "@/lib/auth/sessions";
import { createMockD1Database } from "@/lib/auth/test/mock-d1";
import { createUser, emailExists, findUserByEmail } from "@/lib/auth/users";

const TEST_USER = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
};

describe("Phase 1 users and sessions (TC-1-12 – TC-1-18)", () => {
	let db: D1Database;

	beforeEach(() => {
		db = createMockD1Database();
	});

	it("TC-1-12: user account is created with hashed password", async () => {
		const result = await createUser(db, TEST_USER);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(isPasswordHashed(result.user.passwordHash)).toBe(true);
		expect(result.user.passwordHash).not.toBe(TEST_USER.password);
		await expect(
			verifyPassword(TEST_USER.password, result.user.passwordHash),
		).resolves.toBe(true);
	});

	it("TC-1-13: user can be retrieved by email", async () => {
		const created = await createUser(db, TEST_USER);
		expect(created.ok).toBe(true);

		const user = await findUserByEmail(db, TEST_USER.email);

		expect(user).not.toBeNull();
		expect(user?.fullName).toBe(TEST_USER.fullName);
		expect(user?.email).toBe(TEST_USER.email.toLowerCase());
	});

	it("TC-1-14: duplicate email registration is detectable (case-insensitive)", async () => {
		const first = await createUser(db, TEST_USER);
		expect(first.ok).toBe(true);

		const duplicate = await createUser(db, {
			...TEST_USER,
			email: "Jane@Example.com",
		});

		expect(duplicate.ok).toBe(false);
		if (duplicate.ok) return;
		expect(duplicate.error).toBe("duplicate_email");
		expect(await emailExists(db, "JANE@example.com")).toBe(true);
	});

	it("TC-1-15: session is created for a valid user", async () => {
		const created = await createUser(db, TEST_USER);
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const session = await createSession(db, created.user.id);

		expect(session.id).toBeTruthy();
		expect(session.userId).toBe(created.user.id);
		expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
	});

	it("TC-1-16: valid session is recognized as authenticated", async () => {
		const created = await createUser(db, TEST_USER);
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const session = await createSession(db, created.user.id);
		const result = await validateSession(db, session.id);

		expect(result.authenticated).toBe(true);
		if (!result.authenticated) return;
		expect(result.userId).toBe(created.user.id);
		expect(result.session.id).toBe(session.id);
	});

	it("TC-1-17: invalid or missing session is rejected", async () => {
		const unknown = await validateSession(db, crypto.randomUUID());
		expect(unknown.authenticated).toBe(false);

		const created = await createUser(db, TEST_USER);
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const session = await createSession(db, created.user.id);

		await db
			.prepare(`UPDATE sessions SET expires_at = ?1 WHERE id = ?2`)
			.bind(new Date(Date.now() - 1000).toISOString(), session.id)
			.run();

		const expired = await validateSession(db, session.id);
		expect(expired.authenticated).toBe(false);
	});

	it("TC-1-18: session can be invalidated", async () => {
		const created = await createUser(db, TEST_USER);
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const session = await createSession(db, created.user.id);
		await invalidateSession(db, session.id);

		const result = await validateSession(db, session.id);
		expect(result.authenticated).toBe(false);
	});
});
