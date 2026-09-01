import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { CreateUserInput, CreateUserResult, User } from "@/lib/auth/types";
import { normalizeEmail } from "@/lib/auth/validation";

type UserRow = {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
};

function mapUser(row: UserRow): User {
	return {
		id: row.id,
		fullName: row.full_name,
		email: row.email,
		passwordHash: row.password_hash,
		createdAt: row.created_at,
	};
}

export async function findUserById(
	db: D1Database,
	id: string,
): Promise<User | null> {
	const { results } = await db
		.prepare(
			`SELECT id, full_name, email, password_hash, created_at
       FROM users
       WHERE id = ?1`,
		)
		.bind(id)
		.all<UserRow>();

	const row = results[0];
	return row ? mapUser(row) : null;
}

export async function verifyUserCredentials(
	db: D1Database,
	email: string,
	password: string,
): Promise<User | null> {
	const user = await findUserByEmail(db, email);
	if (!user) {
		return null;
	}

	const valid = await verifyPassword(password, user.passwordHash);
	return valid ? user : null;
}

export async function findUserByEmail(
	db: D1Database,
	email: string,
): Promise<User | null> {
	const normalizedEmail = normalizeEmail(email);
	const { results } = await db
		.prepare(
			`SELECT id, full_name, email, password_hash, created_at
       FROM users
       WHERE email = ?1`,
		)
		.bind(normalizedEmail)
		.all<UserRow>();

	const row = results[0];
	return row ? mapUser(row) : null;
}

export async function emailExists(db: D1Database, email: string): Promise<boolean> {
	const normalizedEmail = normalizeEmail(email);
	const { results } = await db
		.prepare(`SELECT 1 AS found FROM users WHERE email = ?1`)
		.bind(normalizedEmail)
		.all<{ found: number }>();

	return results.length > 0;
}

export async function createUser(
	db: D1Database,
	input: CreateUserInput,
): Promise<CreateUserResult> {
	const normalizedEmail = normalizeEmail(input.email);

	if (await emailExists(db, normalizedEmail)) {
		return { ok: false, error: "duplicate_email" };
	}

	const id = crypto.randomUUID();
	const passwordHash = await hashPassword(input.password);

	const insertResult = await db
		.prepare(
			`INSERT INTO users (id, full_name, email, password_hash)
       VALUES (?1, ?2, ?3, ?4)`,
		)
		.bind(id, input.fullName.trim(), normalizedEmail, passwordHash)
		.run();

	if (!insertResult.success) {
		throw new Error("Failed to create user");
	}

	const user = await findUserByEmail(db, normalizedEmail);
	if (!user) {
		throw new Error("Failed to create user");
	}

	return { ok: true, user };
}
