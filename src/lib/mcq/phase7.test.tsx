/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqDeleteDialog } from "@/components/mcq/mcq-delete-dialog";
import { McqListTable } from "@/components/mcq/mcq-list-table";
import { McqPreviewDialog } from "@/components/mcq/mcq-preview-dialog";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { McqListItem, PreviewMcq } from "@/lib/mcq/types";

const PREVIEW_MCQ: PreviewMcq = {
	id: "mcq-1",
	name: "Capital Cities",
	question: "What is the capital of France?",
	choices: [
		{ id: "choice-1", choiceText: "Paris", position: 0 },
		{ id: "choice-2", choiceText: "London", position: 1 },
	],
};

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
];

function mockPreviewFetch(preview: PreviewMcq = PREVIEW_MCQ) {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ preview }),
		}),
	);
}

describe("Phase 7 MCQ preview and delete flows (TC-M7-01 – TC-M7-08)", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("TC-M7-01: preview dialog shows question and choices without correct answer", async () => {
		mockPreviewFetch();

		render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={vi.fn()} />,
		);

		expect(await screen.findByText("What is the capital of France?")).toBeInTheDocument();
		expect(screen.getByLabelText("Paris")).toBeInTheDocument();
		expect(screen.getByLabelText("London")).toBeInTheDocument();
		expect(screen.queryByText(/correct answer/i)).not.toBeInTheDocument();
		expect(fetch).toHaveBeenCalledWith(
			"/api/mcqs/mcq-1/preview",
			expect.objectContaining({ credentials: "include" }),
		);
	});

	it("TC-M7-02: submit without selection shows validation error", async () => {
		const user = userEvent.setup();
		mockPreviewFetch();

		render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={vi.fn()} />,
		);

		await screen.findByText("What is the capital of France?");
		await user.click(screen.getByRole("button", { name: "Submit Answer" }));

		expect(
			await screen.findByText(MCQ_MESSAGES.selectAnswerRequired),
		).toBeInTheDocument();
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it("TC-M7-03: correct attempt shows success feedback", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ preview: PREVIEW_MCQ }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ isCorrect: true }),
				}),
		);

		render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={vi.fn()} />,
		);

		await screen.findByText("What is the capital of France?");
		await user.click(screen.getByLabelText("Paris"));
		await user.click(screen.getByRole("button", { name: "Submit Answer" }));

		expect(await screen.findByText(MCQ_MESSAGES.previewCorrect)).toBeInTheDocument();
		expect(fetch).toHaveBeenCalledWith(
			"/api/mcqs/mcq-1/attempts",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ selectedChoiceId: "choice-1" }),
			}),
		);
	});

	it("TC-M7-04: incorrect attempt shows failure feedback", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ preview: PREVIEW_MCQ }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ isCorrect: false }),
				}),
		);

		render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={vi.fn()} />,
		);

		await screen.findByText("What is the capital of France?");
		await user.click(screen.getByLabelText("London"));
		await user.click(screen.getByRole("button", { name: "Submit Answer" }));

		expect(await screen.findByText(MCQ_MESSAGES.previewIncorrect)).toBeInTheDocument();
	});

	it("TC-M7-05: delete dialog requires confirmation", () => {
		render(
			<McqDeleteDialog
				mcq={{ id: "mcq-1", name: "Capital Cities" }}
				open
				onOpenChange={vi.fn()}
				onDeleted={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
		expect(
			screen.getByText(/Delete this multiple choice question\?/),
		).toBeInTheDocument();
	});

	it("TC-M7-06: confirmed delete removes row from list", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({}),
			}),
		);

		render(
			<McqListTable mcqs={SAMPLE_MCQS} actionsMenuDefaultOpen />,
		);

		expect(screen.getByText("Capital Cities")).toBeInTheDocument();

		await user.click(screen.getByRole("menuitem", { name: "Delete" }));
		await user.click(screen.getByRole("button", { name: "Delete" }));

		await waitFor(() => {
			expect(screen.queryByText("Capital Cities")).not.toBeInTheDocument();
		});
		expect(fetch).toHaveBeenCalledWith(
			"/api/mcqs/mcq-1",
			expect.objectContaining({ method: "DELETE" }),
		);
	});

	it("TC-M7-07: cancel delete closes dialog without API call", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);

		render(
			<McqDeleteDialog
				mcq={{ id: "mcq-1", name: "Capital Cities" }}
				open
				onOpenChange={onOpenChange}
				onDeleted={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onOpenChange).toHaveBeenCalled();
		expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("TC-M7-08: preview dialog closes on Close button", async () => {
		const user = userEvent.setup();
		const onOpenChange = vi.fn();
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ preview: PREVIEW_MCQ }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ isCorrect: true }),
				}),
		);

		render(
			<McqPreviewDialog mcqId="mcq-1" open onOpenChange={onOpenChange} />,
		);

		await screen.findByText("What is the capital of France?");
		await user.click(screen.getByLabelText("Paris"));
		await user.click(screen.getByRole("button", { name: "Submit Answer" }));
		await screen.findByText(MCQ_MESSAGES.previewCorrect);
		const closeButtons = screen.getAllByRole("button", { name: "Close" });
		await user.click(closeButtons[0]!);

		expect(onOpenChange).toHaveBeenCalled();
		expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
	});
});
