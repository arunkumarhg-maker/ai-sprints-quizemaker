"use server";

import { redirect } from "next/navigation";

import { terminateSession } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
	await terminateSession();
	redirect("/sign-in?loggedOut=1");
}
