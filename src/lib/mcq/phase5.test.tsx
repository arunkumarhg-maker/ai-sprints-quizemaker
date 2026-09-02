/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqActionsMenu } from "@/components/mcq/mcq-actions-menu";
import { McqListPageHeader } from "@/components/mcq/mcq-list-page-header";
import { McqListTable } from "@/components/mcq/mcq-list-table";
import { requireAuthOrExpired } from "@/lib/auth/session";
import {
	MCQ_QUESTION_TABLE_MAX_LENGTH,
	truncateText,
} from "@/lib/mcq/format";
import type { McqListItem } from "@/lib/mcq/types";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
	getDb: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		const error = new Error("NEXT_REDIRECT");
		(error as Error & { digest: string }).digest = `NEXT_REDIRECT;replace;${url}`;
		throw error;
	}),
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		get: vi.fn(() => undefined),
		set: vi.fn(),
		delete: vi.fn(),
	})),
}));

const SAMPLE_MCQS: McqListItem[] = [
	{
		id: "mcq-1",
		name: "Capital Cities",
		question: "What is the capital of France?",
		createdByUserId: "user-1",
		createdAt: "2026-09-01T10:00:00.000Z",
		updatedAt: "2026-09-01T10:00:00.000Z",
		choiceCount: 2,
	},
	{
		id: "mcq-2",
		name: "Long Question",
		question: "A".repeat(MCQ_QUESTION_TABLE_MAX_LENGTH + 20),
		createdByUserId: "user-1",
		createdAt: "2026-09-02T10:00:00.000Z",
		updatedAt: "2026-09-02T10:00:00.000Z",
		choiceCount: 4,
	},
];

describe("Phase 5 MCQ list page (TC-M5-01 – TC-M5-08)", () => {
	it("TC-M5-01: list page renders table headers", () => {
		render(<McqListTable mcqs={SAMPLE_MCQS} />);

		expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Question" })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Created" })).toBeInTheDocument();
		expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
	});

	it("TC-M5-02: create button navigates to /dashboard/mcqs/new", () => {
		render(<McqListPageHeader />);

		expect(
			screen.getByRole("button", { name: "Create Multiple Choice Question" }),
		).toHaveAttribute("href", "/dashboard/mcqs/new");
	});

	it("TC-M5-03: empty state shown when no MCQs", () => {
		render(<McqListTable mcqs={[]} />);

		expect(
			screen.getByText("You have no multiple choice questions yet."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Create Multiple Choice Question" }),
		).toHaveAttribute("href", "/dashboard/mcqs/new");
	});

	it("TC-M5-04: MCQ rows render name, question, created date", () => {
		render(<McqListTable mcqs={[SAMPLE_MCQS[0]!]} />);

		expect(screen.getByText("Capital Cities")).toBeInTheDocument();
		expect(screen.getByText("What is the capital of France?")).toBeInTheDocument();
		expect(screen.getByText(new Date(SAMPLE_MCQS[0]!.createdAt).toLocaleString())).toBeInTheDocument();
	});

	it("TC-M5-05: actions menu has Edit, Preview, and Delete", () => {
		render(<McqActionsMenu mcqId="mcq-1" defaultOpen />);

		expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "Preview" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
	});

	describe("TC-M5-06: unauthenticated user redirected from /dashboard/mcqs", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it("redirects to sign-in when session is missing", async () => {
			await expect(requireAuthOrExpired()).rejects.toThrow("NEXT_REDIRECT");
		});
	});

	it("TC-M5-07: question text truncated in table", () => {
		render(<McqListTable mcqs={[SAMPLE_MCQS[1]!]} />);

		const expected = truncateText(
			SAMPLE_MCQS[1]!.question,
			MCQ_QUESTION_TABLE_MAX_LENGTH,
		);

		expect(screen.getByText(expected)).toBeInTheDocument();
		expect(screen.queryByText(SAMPLE_MCQS[1]!.question)).not.toBeInTheDocument();
	});

	it("TC-M5-08: edit action links to correct edit URL", () => {
		render(<McqActionsMenu mcqId="mcq-1" defaultOpen />);

		expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveAttribute(
			"href",
			"/dashboard/mcqs/mcq-1/edit",
		);
	});
});
