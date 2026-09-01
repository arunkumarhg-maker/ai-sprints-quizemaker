import { logoutAction } from "@/lib/auth/actions/logout";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
	return (
		<form action={logoutAction}>
			<Button type="submit" variant="outline" size="sm">
				Logout
			</Button>
		</form>
	);
}
