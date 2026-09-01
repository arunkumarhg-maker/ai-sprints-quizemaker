import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import type { User } from "@/lib/auth/types";

type AuthenticatedHeaderProps = {
	user: User;
};

export function AuthenticatedHeader({ user }: AuthenticatedHeaderProps) {
	return (
		<header className="border-b border-border bg-background">
			<div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
				<Link href="/dashboard" className="text-sm font-medium text-foreground">
					Quiz Maker
				</Link>
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">
						{user.fullName}
					</span>
					<LogoutButton />
				</div>
			</div>
		</header>
	);
}
