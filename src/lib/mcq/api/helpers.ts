import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqFieldErrors } from "@/lib/mcq/validation";

export type ApiAuthSuccess = {
	ok: true;
	userId: string;
};

export type ApiAuthFailure = {
	ok: false;
	response: NextResponse;
};

export async function requireApiAuth(): Promise<ApiAuthSuccess | ApiAuthFailure> {
	const session = await getCurrentSession();
	if (!session.authenticated) {
		return {
			ok: false,
			response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
		};
	}

	return { ok: true, userId: session.userId };
}

export function jsonNotFound() {
	return NextResponse.json({ error: MCQ_MESSAGES.notFound }, { status: 404 });
}

export function jsonValidationErrors(errors: McqFieldErrors) {
	return NextResponse.json({ errors }, { status: 400 });
}

export function jsonBadRequest(message: string) {
	return NextResponse.json({ error: message }, { status: 400 });
}

export function jsonServerError() {
	return NextResponse.json(
		{ error: MCQ_MESSAGES.somethingWentWrong },
		{ status: 500 },
	);
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}

export async function resolveRouteId(
	params: Promise<{ id: string }>,
): Promise<string> {
	const { id } = await params;
	return id;
}
