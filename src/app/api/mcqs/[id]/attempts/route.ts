import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { findOwnedMcq } from "@/lib/mcq/authorization";
import {
	jsonBadRequest,
	jsonNotFound,
	jsonServerError,
	jsonValidationErrors,
	parseJsonBody,
	requireApiAuth,
	resolveRouteId,
} from "@/lib/mcq/api/helpers";
import { recordAttempt } from "@/lib/mcq/attempts";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import {
	parseRecordAttemptInput,
	recordAttemptSchema,
} from "@/lib/mcq/schemas/mcq";
import type { RecordAttemptInput } from "@/lib/mcq/types";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
	const auth = await requireApiAuth();
	if (!auth.ok) {
		return auth.response;
	}

	const id = await resolveRouteId(context.params);
	const body = await parseJsonBody<RecordAttemptInput>(request);
	if (!body) {
		return jsonValidationErrors({ form: "Invalid request body." });
	}

	const parsed = recordAttemptSchema.safeParse(parseRecordAttemptInput(body));
	if (!parsed.success) {
		return jsonBadRequest(MCQ_MESSAGES.invalidSelectedChoice);
	}

	try {
		const db = await getDb();
		const owned = await findOwnedMcq(db, id, auth.userId);
		if (!owned) {
			return jsonNotFound();
		}

		const result = await recordAttempt(
			db,
			id,
			auth.userId,
			parsed.data.selectedChoiceId,
		);
		if (!result) {
			return jsonBadRequest(MCQ_MESSAGES.invalidSelectedChoice);
		}

		return NextResponse.json(
			{
				attempt: result.attempt,
				isCorrect: result.isCorrect,
			},
			{ status: 201 },
		);
	} catch {
		return jsonServerError();
	}
}
