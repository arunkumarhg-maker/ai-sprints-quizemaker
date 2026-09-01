import { AUTH_MESSAGES } from "@/lib/auth/messages";

type AuthNoticeProps = {
	message: string;
};

function AuthNotice({ message }: AuthNoticeProps) {
	return (
		<div
			role="status"
			className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
		>
			{message}
		</div>
	);
}

export function SignInRequiredMessage() {
	return <AuthNotice message={AUTH_MESSAGES.signInRequired} />;
}

export function SessionExpiredMessage() {
	return <AuthNotice message={AUTH_MESSAGES.sessionExpired} />;
}
