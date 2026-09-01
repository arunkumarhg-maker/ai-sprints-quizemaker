import { cookies } from "next/headers";

import { SESSION_MAX_AGE_MS } from "@/lib/auth/config";

export const SESSION_COOKIE_NAME = "quizemaker_session";

export async function getSessionCookie(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
		path: "/",
	});
}

export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE_NAME);
}
