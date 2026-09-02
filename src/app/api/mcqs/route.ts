import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
	jsonServerError,
	jsonValidationErrors,
	parseJsonBody,
	requireApiAuth,
} from "@/lib/mcq/api/helpers";
import { createMcq, listMcqsByUser } from "@/lib/mcq/mcqs";
import {
	mcqInputSchema,
	zodErrorsToMcqFieldErrors,
} from "@/lib/mcq/schemas/mcq";
import type { CreateMcqInput } from "@/lib/mcq/types";

export async function GET() {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	try {
		const db = await getDb();
		const mcqs = await listMcqsByUser(db, auth.userId);
		return NextResponse.json({ mcqs });
	} catch {
		return jsonServerError();
	}
}

export async function POST(request: Request) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const body = await parseJsonBody<CreateMcqInput>(request);
	if (!body) {
		return jsonValidationErrors({ form: "Invalid request body." });
	}

	const parsed = mcqInputSchema.safeParse(body);
	if (!parsed.success) {
		return jsonValidationErrors(zodErrorsToMcqFieldErrors(parsed.error));
	}

	try {
		const db = await getDb();
		const mcq = await createMcq(db, auth.userId, parsed.data);
		return NextResponse.json({ mcq }, { status: 201 });
	} catch {
		return jsonServerError();
	}
}
