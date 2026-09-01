import { AuthenticatedHeader } from "@/components/auth/authenticated-header";
import { requireAuthOrExpired } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await requireAuthOrExpired();

	return (
		<div className="min-h-screen bg-background">
			<AuthenticatedHeader user={session.user} />
			{children}
		</div>
	);
}
