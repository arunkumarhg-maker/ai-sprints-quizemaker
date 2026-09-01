import { AUTH_MESSAGES } from "@/lib/auth/messages";

export function RegistrationSuccessMessage() {
	return (
		<div role="status" className="text-sm text-green-600 dark:text-green-500">
			{AUTH_MESSAGES.registrationSuccess}
		</div>
	);
}
