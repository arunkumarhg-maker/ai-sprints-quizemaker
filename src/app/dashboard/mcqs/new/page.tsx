import { McqForm } from "@/components/mcq/mcq-form";

export const dynamic = "force-dynamic";
export default function NewMcqPage() {
	return (
		<main className="mx-auto w-full max-w-3xl p-4">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight">
					Create Multiple Choice Question
				</h1>
				<p className="text-sm text-muted-foreground">
					Add a question, answer choices, and mark one correct answer.
				</p>
			</div>
			<McqForm mode="create" />
		</main>
	);
}
