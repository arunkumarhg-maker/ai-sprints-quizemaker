import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
	jsonNotFound,
	jsonServerError,
	requireApiAuth,
	resolveRouteId,
} from "@/lib/mcq/api/helpers";
import { getMcqPreview } from "@/lib/mcq/mcqs";

type RouteContext = {
	params: Promise<{ id: string }>;
};

function methodNotAllowed() {
	return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function GET(_request: Request, context: RouteContext) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const id = await resolveRouteId(context.params);

	try {
		const db = await getDb();
		const preview = await getMcqPreview(db, id, auth.userId);
		if (!preview) {
			return jsonNotFound();
		}

		return NextResponse.json({ preview });
	} catch {
		return jsonServerError();
	}
}

export function POST() {
	return methodNotAllowed();
}
