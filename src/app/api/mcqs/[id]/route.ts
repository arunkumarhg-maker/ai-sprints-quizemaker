import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
	jsonNotFound,
	jsonServerError,
	jsonValidationErrors,
	parseJsonBody,
	requireApiAuth,
	resolveRouteId,
} from "@/lib/mcq/api/helpers";
import { deleteMcq, getMcqById, updateMcq } from "@/lib/mcq/mcqs";
import {
	mcqInputSchema,
	zodErrorsToMcqFieldErrors,
} from "@/lib/mcq/schemas/mcq";
import type { UpdateMcqInput } from "@/lib/mcq/types";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const id = await resolveRouteId(context.params);

	try {
		const db = await getDb();
		const mcq = await getMcqById(db, id, auth.userId);
		if (!mcq) {
			return jsonNotFound();
		}

		return NextResponse.json({ mcq });
	} catch {
		return jsonServerError();
	}
}

export async function PUT(request: Request, context: RouteContext) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const id = await resolveRouteId(context.params);
	const body = await parseJsonBody<UpdateMcqInput>(request);
	if (!body) {
		return jsonValidationErrors({ form: "Invalid request body." });
	}

	const parsed = mcqInputSchema.safeParse(body);
	if (!parsed.success) {
		return jsonValidationErrors(zodErrorsToMcqFieldErrors(parsed.error));
	}

	try {
		const db = await getDb();
		const mcq = await updateMcq(db, id, auth.userId, parsed.data);
		if (!mcq) {
			return jsonNotFound();
		}

		return NextResponse.json({ mcq });
	} catch {
		return jsonServerError();
	}
}

export async function DELETE(_request: Request, context: RouteContext) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const id = await resolveRouteId(context.params);

	try {
		const db = await getDb();
		const deleted = await deleteMcq(db, id, auth.userId);
		if (!deleted) {
			return jsonNotFound();
		}

		return NextResponse.json({ success: true });
	} catch {
		return jsonServerError();
	}
}
