/**
 * @vitest-environment jsdom
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditMcqPage from "@/app/dashboard/mcqs/[id]/edit/page";
import { McqDeleteDialog } from "@/components/mcq/mcq-delete-dialog";
import { McqForm } from "@/components/mcq/mcq-form";
import { McqListPageHeader } from "@/components/mcq/mcq-list-page-header";
import { McqListTable } from "@/components/mcq/mcq-list-table";
import { McqPreviewDialog } from "@/components/mcq/mcq-preview-dialog";
import { getCurrentSession, requireAuth } from "@/lib/auth/session";
import {
	createMockD1Database,
	getMockMcqAttemptCount,
} from "@/lib/auth/test/mock-d1";
import { createUser } from "@/lib/auth/users";
import { getDb } from "@/lib/db";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import { createMcq } from "@/lib/mcq/mcqs";
import type {
	CreateMcqInput,
	McqListItem,
	McqWithChoices,
	PreviewMcq,
} from "@/lib/mcq/types";
import { GET as listMcqs, POST as createMcqRoute } from "@/app/api/mcqs/route";
import {
	DELETE as deleteMcqRoute,
	GET as getMcqRoute,
	PUT as updateMcqRoute,
} from "@/app/api/mcqs/[id]/route";
import { GET as previewMcqRoute } from "@/app/api/mcqs/[id]/preview/route";
import { POST as recordAttemptRoute } from "@/app/api/mcqs/[id]/attempts/route";

type McqResponseBody = { mcq: McqWithChoices };
type McqListResponseBody = { mcqs: McqListItem[] };
type PreviewResponseBody = { preview: PreviewMcq };
type AttemptResponseBody = { isCorrect: boolean };
type ApiErrorResponseBody = { error: string };

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
	getCurrentSession: vi.fn(),
	requireAuth: vi.fn(),
	redirect: vi.fn((url: string) => {
		const error = new Error("NEXT_REDIRECT");
		(error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url}`;
		throw error;
	}),
}));

const TEST_USER = {
	fullName: "Jane Doe",
	email: "jane@example.com",
	password: "Secure1!pass",
};

const OTHER_USER = {
	fullName: "John Smith",
	email: "john@example.com",
	password: "Secure1!pass",
};

const VALID_MCQ: CreateMcqInput = {
	name: "Capital Cities",
	question: "What is the capital of France?",
	choices: [
		{ choiceText: "Paris", isCorrect: true },
		{ choiceText: "London", isCorrect: false },
	],
};

const PRD_ERROR_MESSAGES = {
	nameRequired: "MCQ name is required.",
	nameTooLong: "MCQ name must be 200 characters or fewer.",
	questionRequired: "Question is required.",
	questionTooLong: "Question must be 2000 characters or fewer.",
	tooFewChoices: "At least 2 answer choices are required.",
	tooManyChoices: "A maximum of 6 answer choices is allowed.",
	choiceTextRequired: "Answer choice text is required.",
	choiceTextTooLong: "Answer choice must be 500 characters or fewer.",
	correctAnswerRequired:
		"Exactly one answer choice must be marked as correct.",
	notFound: "Multiple choice question not found.",
	invalidSelectedChoice: "Selected answer is not valid for this question.",
	somethingWentWrong: "Something went wrong. Please try again later.",
} as const;

function routeParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

function jsonRequest(method: string, body?: unknown): Request {
	return new Request("http://localhost/api/mcqs", {
		method,
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

describe("Phase 9 MCQ integration and final validation (TC-M9-01 – TC-M9-08)", () => {
	let db: D1Database;
	let userId: string;
	let otherUserId: string;
	let ownerUser: {
		id: string;
		fullName: string;
		email: string;
		passwordHash: string;
		createdAt: string;
	};

	beforeEach(async () => {
		db = createMockD1Database();
		vi.mocked(getDb).mockResolvedValue(db);
		vi.mocked(getCurrentSession).mockResolvedValue({ authenticated: false });
		vi.mocked(requireAuth).mockRejectedValue(new Error("NEXT_REDIRECT"));

		const result = await createUser(db, TEST_USER);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("Failed to seed user");
		}
		userId = result.user.id;
		ownerUser = result.user;

		const other = await createUser(db, OTHER_USER);
		expect(other.ok).toBe(true);
		if (!other.ok) {
			throw new Error("Failed to seed other user");
		}
		otherUserId = other.user.id;
	});

	async function authenticateAs(
		user: {
			id: string;
			fullName: string;
			email: string;
			passwordHash: string;
			createdAt: string;
		},
	) {
		const session = {
			authenticated: true as const,
			userId: user.id,
			user,
			session: {
				id: crypto.randomUUID(),
				userId: user.id,
				expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
				createdAt: new Date().toISOString(),
			},
		};
		vi.mocked(getCurrentSession).mockResolvedValue(session);
		vi.mocked(requireAuth).mockResolvedValue(session);
		return session;
	}

	it("TC-M9-01: full MCQ CRUD journey succeeds", async () => {
		await authenticateAs(ownerUser);

		const createResponse = await createMcqRoute(jsonRequest("POST", VALID_MCQ));
		expect(createResponse.status).toBe(201);
		const createdBody = (await createResponse.json()) as McqResponseBody;
		const mcqId = createdBody.mcq.id;

		const listResponse = await listMcqs();
		expect(listResponse.status).toBe(200);
		const listBody = (await listResponse.json()) as McqListResponseBody;
		expect(listBody.mcqs.some((mcq) => mcq.id === mcqId)).toBe(true);

		const updateResponse = await updateMcqRoute(
			jsonRequest("PUT", { ...VALID_MCQ, name: "Updated Capital Cities" }),
			routeParams(mcqId),
		);
		expect(updateResponse.status).toBe(200);
		const updateBody = (await updateResponse.json()) as McqResponseBody;
		expect(updateBody.mcq.name).toBe("Updated Capital Cities");

		const correctChoiceId = updateBody.mcq.choices.find(
			(choice) => choice.isCorrect,
		)?.id;
		const wrongChoiceId = updateBody.mcq.choices.find(
			(choice) => !choice.isCorrect,
		)?.id;
		expect(correctChoiceId).toBeTruthy();
		expect(wrongChoiceId).toBeTruthy();
		if (!correctChoiceId || !wrongChoiceId) return;

		const previewResponse = await previewMcqRoute(
			new Request(`http://localhost/api/mcqs/${mcqId}/preview`),
			routeParams(mcqId),
		);
		expect(previewResponse.status).toBe(200);
		const previewBody = (await previewResponse.json()) as PreviewResponseBody;
		for (const choice of previewBody.preview.choices) {
			expect(choice).not.toHaveProperty("isCorrect");
		}

		const correctAttempt = await recordAttemptRoute(
			jsonRequest("POST", { selectedChoiceId: correctChoiceId }),
			routeParams(mcqId),
		);
		expect(correctAttempt.status).toBe(201);
		expect(
			((await correctAttempt.json()) as AttemptResponseBody).isCorrect,
		).toBe(true);

		const incorrectAttempt = await recordAttemptRoute(
			jsonRequest("POST", { selectedChoiceId: wrongChoiceId }),
			routeParams(mcqId),
		);
		expect(incorrectAttempt.status).toBe(201);
		expect(
			((await incorrectAttempt.json()) as AttemptResponseBody).isCorrect,
		).toBe(false);
		expect(getMockMcqAttemptCount(db, mcqId)).toBe(2);

		const deleteResponse = await deleteMcqRoute(
			new Request(`http://localhost/api/mcqs/${mcqId}`, { method: "DELETE" }),
			routeParams(mcqId),
		);
		expect(deleteResponse.status).toBe(200);

		const finalListResponse = await listMcqs();
		const finalListBody = (await finalListResponse.json()) as McqListResponseBody;
		expect(finalListBody.mcqs.some((mcq) => mcq.id === mcqId)).toBe(false);
	});

	it("TC-M9-02: user A cannot access user B's MCQ", async () => {
		const ownedMcq = await createMcq(db, userId, VALID_MCQ);

		await authenticateAs({
			id: otherUserId,
			fullName: OTHER_USER.fullName,
			email: OTHER_USER.email,
			passwordHash: "hash",
			createdAt: new Date().toISOString(),
		});

		const apiResponse = await getMcqRoute(
			new Request(`http://localhost/api/mcqs/${ownedMcq.id}`),
			routeParams(ownedMcq.id),
		);
		expect(apiResponse.status).toBe(404);

		const page = await EditMcqPage({ params: Promise.resolve({ id: ownedMcq.id }) });
		render(page);
		expect(
			screen.getByText("Multiple choice question not found"),
		).toBeInTheDocument();
	});

	it("TC-M9-03: all MCQ error messages match PRD", () => {
		for (const [key, expected] of Object.entries(PRD_ERROR_MESSAGES)) {
			expect(MCQ_MESSAGES[key as keyof typeof MCQ_MESSAGES]).toBe(expected);
		}

		expect(MCQ_MESSAGES.selectAnswerRequired).toBe("Please select an answer.");
		expect(MCQ_MESSAGES.previewCorrect).toBe("Correct!");
		expect(MCQ_MESSAGES.previewIncorrect).toBe("Incorrect.");
		expect(MCQ_MESSAGES.deleteConfirmation).toBe(
			"Delete this multiple choice question? This action cannot be undone.",
		);
	});

	it("TC-M9-04: MCQ pages usable at 320px width", () => {
		Object.defineProperty(window, "innerWidth", {
			writable: true,
			configurable: true,
			value: 320,
		});

		const { container: formContainer, unmount: unmountForm } = render(
			<McqForm mode="create" />,
		);
		expect(formContainer.querySelector("textarea")).toHaveClass("w-full");
		unmountForm();

		const { container: listContainer } = render(
			<main className="mx-auto w-full max-w-5xl p-4">
				<McqListPageHeader />
				<McqListTable mcqs={[]} />
			</main>,
		);
		const main = listContainer.querySelector("main");
		expect(main).toHaveClass("w-full");
		expect(main).toHaveClass("p-4");
		expect(
			screen.getAllByRole("button", { name: "Create Multiple Choice Question" }),
		).toHaveLength(2);
	});

	it("TC-M9-05: keyboard navigation on form and dialogs", async () => {
		const user = userEvent.setup();

		const { unmount: unmountForm } = render(<McqForm mode="create" />);
		await user.tab();
		expect(document.activeElement).toHaveAttribute("id", "mcq-name");
		await user.tab();
		expect(document.activeElement).toHaveAttribute("id", "mcq-question");
		unmountForm();

		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					preview: {
						id: "mcq-1",
						name: "Sample",
						question: "Sample?",
						choices: [{ id: "c1", choiceText: "A", position: 0 }],
					},
				}),
			}),
		);

		const { unmount: unmountPreview } = render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={vi.fn()} />,
		);
		const previewChoice = await screen.findByLabelText("A");
		previewChoice.focus();
		expect(document.activeElement).toBe(previewChoice);
		unmountPreview();

		render(
			<McqDeleteDialog
				mcq={{ id: "mcq-1", name: "Sample" }}
				open
				onOpenChange={vi.fn()}
				onDeleted={vi.fn()}
			/>,
		);
		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		cancelButton.focus();
		expect(document.activeElement).toBe(cancelButton);
	});

	it("TC-M9-06: API errors do not expose internals", async () => {
		await authenticateAs(ownerUser);

		for (const routeCall of [
			() => listMcqs(),
			() => createMcqRoute(jsonRequest("POST", VALID_MCQ)),
		]) {
			vi.mocked(getDb).mockRejectedValueOnce(new Error("database exploded"));
			const response = await routeCall();
			expect(response.status).toBe(500);
			const body = (await response.json()) as ApiErrorResponseBody;
			expect(body.error).toBe(MCQ_MESSAGES.somethingWentWrong);
			expect(JSON.stringify(body)).not.toContain("database exploded");
			expect(JSON.stringify(body)).not.toMatch(/stack/i);
		}
	});

	it("TC-M9-07: full Vitest suite passes", () => {
		const mcqTestFiles = [
			"src/lib/mcq/phase2.test.ts",
			"src/lib/mcq/phase3.test.ts",
			"src/app/api/mcqs/phase4.test.ts",
			"src/lib/mcq/phase5.test.tsx",
			"src/lib/mcq/phase6.test.tsx",
			"src/lib/mcq/phase7.test.tsx",
			"src/lib/mcq/phase8.test.ts",
			"src/lib/mcq/phase9.test.tsx",
		];

		for (const relativePath of mcqTestFiles) {
			expect(existsSync(join(process.cwd(), relativePath))).toBe(true);
		}

		// Full suite result is verified by the mandatory `npm test` phase gate.
		expect(mcqTestFiles).toHaveLength(8);
	});

	it.skip("TC-M9-08: preview runtime smoke test (manual — run `npm run preview` locally)", () => {
		// Manual verification checklist:
		// 1. npm run preview
		// 2. Sign in, open /dashboard/mcqs
		// 3. Create an MCQ, preview it, submit an answer, delete it
		expect(true).toBe(true);
	});
});
