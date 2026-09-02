import { McqForm } from "@/components/mcq/mcq-form";
import { McqNotFound } from "@/components/mcq/mcq-not-found";
import { requireAuth } from "@/lib/auth/session";
import { getMcqById } from "@/lib/mcq/mcqs";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditMcqPageProps = {
	params: Promise<{ id: string }>;
};

export default async function EditMcqPage({ params }: EditMcqPageProps) {
	const session = await requireAuth();
	const { id } = await params;
	const db = await getDb();
	const mcq = await getMcqById(db, id, session.userId);

	if (!mcq) {
		return (
			<main className="mx-auto w-full max-w-3xl p-4">
				<McqNotFound />
			</main>
		);
	}

	return (
		<main className="mx-auto w-full max-w-3xl p-4">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight">
					Edit Multiple Choice Question
				</h1>
				<p className="text-sm text-muted-foreground">
					Update the question, choices, or correct answer.
				</p>
			</div>
			<McqForm
				mode="edit"
				mcqId={mcq.id}
				initialValues={{
					name: mcq.name,
					question: mcq.question,
					choices: mcq.choices.map((choice) => ({
						choiceText: choice.choiceText,
						isCorrect: choice.isCorrect,
					})),
				}}
			/>
		</main>
	);
}
