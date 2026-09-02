/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McqForm } from "@/components/mcq/mcq-form";
import { McqNotFound } from "@/components/mcq/mcq-not-found";
import { MCQ_MESSAGES } from "@/lib/mcq/messages";
import type { CreateMcqInput } from "@/lib/mcq/types";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

const VALID_MCQ: CreateMcqInput = {
	name: "Capital Cities",
	question: "What is the capital of France?",
	choices: [
		{ choiceText: "Paris", isCorrect: true },
		{ choiceText: "London", isCorrect: false },
	],
};

describe("Phase 6 MCQ create/edit form (TC-M6-01 – TC-M6-12)", () => {
	beforeEach(() => {
		mockPush.mockReset();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 201,
				json: async () => ({ mcq: { id: "mcq-1" } }),
			}),
		);
	});

	it("TC-M6-01: form renders name, question, choice fields", () => {
		render(<McqForm mode="create" />);

		expect(screen.getByLabelText("MCQ Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Question")).toBeInTheDocument();
		expect(screen.getByLabelText("Choice 1 text")).toBeInTheDocument();
		expect(screen.getByLabelText("Choice 2 text")).toBeInTheDocument();
	});

	it("TC-M6-02: default two choice rows on create", () => {
		render(<McqForm mode="create" />);

		expect(screen.getAllByLabelText(/Choice \d text/)).toHaveLength(2);
	});

	it("TC-M6-03: add choice increases count up to 6", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		const addButton = screen.getByRole("button", { name: "Add Choice" });

		for (let index = 0; index < 4; index += 1) {
			await user.click(addButton);
		}

		expect(screen.getAllByLabelText(/Choice \d text/)).toHaveLength(6);
		expect(addButton).toBeDisabled();
	});

	it("TC-M6-04: remove choice decreases count down to 2", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Add Choice" }));

		const removeButtons = screen.getAllByRole("button", { name: "Remove" });
		expect(removeButtons).toHaveLength(3);

		await user.click(removeButtons[0]!);
		expect(screen.getAllByLabelText(/Choice \d text/)).toHaveLength(2);
		expect(screen.getAllByRole("button", { name: "Remove" })[0]).toBeDisabled();
	});

	it("TC-M6-05: submit empty form shows validation errors", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(await screen.findByText(MCQ_MESSAGES.nameRequired)).toBeInTheDocument();
		expect(screen.getByText(MCQ_MESSAGES.questionRequired)).toBeInTheDocument();
		expect(fetch).not.toHaveBeenCalled();
	});

	it("TC-M6-06: no correct answer selected shows error", async () => {
		const user = userEvent.setup();
		render(
			<McqForm
				mode="create"
				initialValues={{
					name: "Sample",
					question: "Sample question?",
					choices: [
						{ choiceText: "A", isCorrect: false },
						{ choiceText: "B", isCorrect: false },
					],
				}}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Save" }));

		expect(
			await screen.findByText(MCQ_MESSAGES.correctAnswerRequired),
		).toBeInTheDocument();
	});

	it("TC-M6-07: successful create redirects to list", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.type(screen.getByLabelText("MCQ Name"), VALID_MCQ.name);
		await user.type(screen.getByLabelText("Question"), VALID_MCQ.question);
		await user.type(screen.getByLabelText("Choice 1 text"), "Paris");
		await user.type(screen.getByLabelText("Choice 2 text"), "London");
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				"/api/mcqs",
				expect.objectContaining({ method: "POST" }),
			);
		});
		expect(mockPush).toHaveBeenCalledWith("/dashboard/mcqs");
	});

	it("TC-M6-08: cancel returns to list without save", async () => {
		const user = userEvent.setup();
		render(<McqForm mode="create" />);

		await user.type(screen.getByLabelText("MCQ Name"), "Draft");
		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
			"href",
			"/dashboard/mcqs",
		);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("TC-M6-09: edit form pre-fills existing data", () => {
		render(<McqForm mode="edit" mcqId="mcq-1" initialValues={VALID_MCQ} />);

		expect(screen.getByLabelText("MCQ Name")).toHaveValue(VALID_MCQ.name);
		expect(screen.getByLabelText("Question")).toHaveValue(VALID_MCQ.question);
		expect(screen.getByLabelText("Choice 1 text")).toHaveValue("Paris");
		expect(screen.getByLabelText("Choice 2 text")).toHaveValue("London");
		expect(screen.getByLabelText("Mark choice 1 as correct")).toBeChecked();
	});

	it("TC-M6-10: successful update redirects to list", async () => {
		const user = userEvent.setup();
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => ({ mcq: { id: "mcq-1" } }),
			}),
		);

		render(<McqForm mode="edit" mcqId="mcq-1" initialValues={VALID_MCQ} />);

		await user.clear(screen.getByLabelText("MCQ Name"));
		await user.type(screen.getByLabelText("MCQ Name"), "Updated Name");
		await user.click(screen.getByRole("button", { name: "Save" }));

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith(
				"/api/mcqs/mcq-1",
				expect.objectContaining({ method: "PUT" }),
			);
		});
		expect(mockPush).toHaveBeenCalledWith("/dashboard/mcqs");
	});

	it("TC-M6-11: edit page shows not found UI for missing MCQ", () => {
		render(<McqNotFound />);

		expect(
			screen.getByText("Multiple choice question not found"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Back to Multiple Choice Questions" }),
		).toHaveAttribute("href", "/dashboard/mcqs");
	});

	it("TC-M6-12: save shows loading state during submit", async () => {
		const user = userEvent.setup();
		let resolveFetch: (value: unknown) => void = () => undefined;
		vi.stubGlobal(
			"fetch",
			vi.fn(
				() =>
					new Promise((resolve) => {
						resolveFetch = resolve;
					}),
			),
		);

		render(<McqForm mode="create" initialValues={VALID_MCQ} />);

		await user.click(screen.getByRole("button", { name: "Save" }));

		const savingButton = await screen.findByRole("button", { name: "Saving..." });
		expect(savingButton).toBeDisabled();
		expect(savingButton).toHaveAttribute("aria-busy", "true");

		resolveFetch({
			ok: true,
			status: 201,
			json: async () => ({ mcq: { id: "mcq-1" } }),
		});
	});
});
