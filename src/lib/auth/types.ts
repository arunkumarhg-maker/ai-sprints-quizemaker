export interface User {
	id: string;
	fullName: string;
	email: string;
	passwordHash: string;
	createdAt: string;
}

export interface Session {
	id: string;
	userId: string;
	expiresAt: string;
	createdAt: string;
}

export type SessionValidationResult =
	| { authenticated: true; userId: string; session: Session }
	| { authenticated: false };

export type CreateUserInput = {
	fullName: string;
	email: string;
	password: string;
};

export type CreateUserResult =
	| { ok: true; user: User }
	| { ok: false; error: "duplicate_email" };
