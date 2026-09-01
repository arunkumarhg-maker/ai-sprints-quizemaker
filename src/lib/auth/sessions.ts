import { SESSION_MAX_AGE_MS } from "@/lib/auth/config";
import type { Session, SessionValidationResult } from "@/lib/auth/types";

type SessionRow = {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
};

function mapSession(row: SessionRow): Session {
	return {
		id: row.id,
		userId: row.user_id,
		expiresAt: row.expires_at,
		createdAt: row.created_at,
	};
}

function isExpired(expiresAt: string): boolean {
	return new Date(expiresAt).getTime() <= Date.now();
}

export async function createSession(
	db: D1Database,
	userId: string,
): Promise<Session> {
	const id = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();

	await db
		.prepare(
			`INSERT INTO sessions (id, user_id, expires_at)
       VALUES (?1, ?2, ?3)`,
		)
		.bind(id, userId, expiresAt)
		.run();

	const { results } = await db
		.prepare(
			`SELECT id, user_id, expires_at, created_at
       FROM sessions
       WHERE id = ?1`,
		)
		.bind(id)
		.all<SessionRow>();

	const row = results[0];
	if (!row) {
		throw new Error("Failed to create session");
	}

	return mapSession(row);
}

export async function validateSession(
	db: D1Database,
	sessionId: string,
): Promise<SessionValidationResult> {
	const { results } = await db
		.prepare(
			`SELECT id, user_id, expires_at, created_at
       FROM sessions
       WHERE id = ?1`,
		)
		.bind(sessionId)
		.all<SessionRow>();

	const row = results[0];
	if (!row) {
		return { authenticated: false };
	}

	const session = mapSession(row);
	if (isExpired(session.expiresAt)) {
		await invalidateSession(db, sessionId);
		return { authenticated: false };
	}

	return {
		authenticated: true,
		userId: session.userId,
		session,
	};
}

export async function invalidateSession(
	db: D1Database,
	sessionId: string,
): Promise<void> {
	await db.prepare(`DELETE FROM sessions WHERE id = ?1`).bind(sessionId).run();
}
