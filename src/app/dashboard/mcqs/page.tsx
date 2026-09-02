import { McqListPageHeader } from "@/components/mcq/mcq-list-page-header";
import { McqListTable } from "@/components/mcq/mcq-list-table";
import { requireAuth } from "@/lib/auth/session";
import { listMcqsByUser } from "@/lib/mcq/mcqs";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function McqsPage() {
	const session = await requireAuth();
	const db = await getDb();
	const mcqs = await listMcqsByUser(db, session.userId);

	return (
		<main className="mx-auto w-full max-w-5xl p-4">
			<McqListPageHeader />
			<McqListTable mcqs={mcqs} />
		</main>
	);
}
