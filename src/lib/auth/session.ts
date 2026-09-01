import { redirect } from "next/navigation";
import {
	clearSessionCookie,
	getSessionCookie,
	setSessionCookie,
} from "@/lib/auth/session-cookie";
import { createSession, invalidateSession, validateSession } from "@/lib/auth/sessions";
import type { SessionValidationResult, User } from "@/lib/auth/types";
import { findUserById, verifyUserCredentials } from "@/lib/auth/users";
import { getDb } from "@/lib/db";

export type AuthenticatedSession = SessionValidationResult & {
	authenticated: true;
	user: User;
};

export async function getCurrentSession(): Promise<
	AuthenticatedSession | { authenticated: false }
> {
	const sessionId = await getSessionCookie();
	if (!sessionId) {
		return { authenticated: false };
	}

	const db = await getDb();
	const result = await validateSession(db, sessionId);

	if (!result.authenticated) {
		await clearSessionCookie();
		return { authenticated: false };
	}

	const user = await findUserById(db, result.userId);
	if (!user) {
		await invalidateSession(db, sessionId);
		await clearSessionCookie();
		return { authenticated: false };
	}

	return {
		authenticated: true,
		userId: result.userId,
		session: result.session,
		user,
	};
}

export async function establishSession(userId: string): Promise<void> {
	const db = await getDb();
	const session = await createSession(db, userId);
	await setSessionCookie(session.id);
}

export async function terminateSession(): Promise<void> {
	const sessionId = await getSessionCookie();
	if (sessionId) {
		const db = await getDb();
		await invalidateSession(db, sessionId);
	}
	await clearSessionCookie();
}

export async function authenticateUser(
	email: string,
	password: string,
): Promise<User | null> {
	const db = await getDb();
	return verifyUserCredentials(db, email, password);
}

export async function requireAuth(): Promise<AuthenticatedSession> {
	const session = await getCurrentSession();
	if (!session.authenticated) {
		redirect("/sign-in?reason=sign-in-required");
	}
	return session;
}

export async function requireAuthOrExpired(): Promise<AuthenticatedSession> {
	const sessionId = await getSessionCookie();

	if (!sessionId) {
		redirect("/sign-in?reason=sign-in-required");
	}

	const db = await getDb();
	const result = await validateSession(db, sessionId);

	if (!result.authenticated) {
		await clearSessionCookie();
		redirect("/sign-in?reason=session-expired");
	}

	const user = await findUserById(db, result.userId);
	if (!user) {
		await invalidateSession(db, sessionId);
		await clearSessionCookie();
		redirect("/sign-in?reason=session-expired");
	}

	return {
		authenticated: true,
		userId: result.userId,
		session: result.session,
		user,
	};
}

export async function redirectIfAuthenticated(): Promise<void> {
	const session = await getCurrentSession();
	if (session.authenticated) {
		redirect("/dashboard");
	}
}
