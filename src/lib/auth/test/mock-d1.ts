/**
 * In-memory D1 mock for unit/integration tests.
 * Supports SQL statements used by auth and MCQ repositories.
 */

type UserRow = {
	id: string;
	full_name: string;
	email: string;
	password_hash: string;
	created_at: string;
};

type SessionRow = {
	id: string;
	user_id: string;
	expires_at: string;
	created_at: string;
};

type McqRow = {
	id: string;
	name: string;
	question: string;
	created_by_user_id: string;
	created_at: string;
	updated_at: string;
};

type McqChoiceRow = {
	id: string;
	mcq_id: string;
	choice_text: string;
	is_correct: number;
	position: number;
	created_at: string;
	updated_at: string;
};

type McqAttemptRow = {
	id: string;
	mcq_id: string;
	user_id: string;
	selected_choice_id: string;
	is_correct: number;
	created_at: string;
};

class MockPreparedStatement {
	constructor(
		private readonly sql: string,
		private readonly db: MockD1Database,
		private bindings: unknown[] = [],
	) {}

	bind(...values: unknown[]): MockPreparedStatement {
		return new MockPreparedStatement(this.sql, this.db, values);
	}

	async run(): Promise<{ success: true }> {
		this.db.execute(this.sql, this.bindings);
		return { success: true };
	}

	async all<T>(): Promise<{ results: T[] }> {
		return { results: this.db.query<T>(this.sql, this.bindings) };
	}

	async first<T>(): Promise<T | null> {
		const { results } = await this.all<T>();
		return results[0] ?? null;
	}
}

export class MockD1Database {
	private users: UserRow[] = [];
	private sessions: SessionRow[] = [];
	private mcqs: McqRow[] = [];
	private mcqChoices: McqChoiceRow[] = [];
	private mcqAttempts: McqAttemptRow[] = [];

	prepare(sql: string): MockPreparedStatement {
		return new MockPreparedStatement(sql.replace(/\s+/g, " ").trim(), this);
	}

	private execute(sql: string, bindings: unknown[]): void {
		const normalized = sql.replace(/\s+/g, " ").trim();

		if (
			normalized.startsWith(
				"INSERT INTO users (id, full_name, email, password_hash)",
			)
		) {
			const [id, full_name, email, password_hash] = bindings as string[];
			this.users.push({
				id,
				full_name,
				email,
				password_hash,
				created_at: new Date().toISOString(),
			});
			return;
		}

		if (
			normalized.startsWith("INSERT INTO sessions (id, user_id, expires_at)")
		) {
			const [id, user_id, expires_at] = bindings as string[];
			this.sessions.push({
				id,
				user_id,
				expires_at,
				created_at: new Date().toISOString(),
			});
			return;
		}

		if (normalized.startsWith("DELETE FROM sessions WHERE id =")) {
			const [id] = bindings as string[];
			this.sessions = this.sessions.filter((session) => session.id !== id);
			return;
		}

		if (normalized.startsWith("UPDATE sessions SET expires_at =")) {
			const [expires_at, id] = bindings as string[];
			const session = this.sessions.find((item) => item.id === id);
			if (session) {
				session.expires_at = expires_at;
			}
			return;
		}

		if (
			normalized.startsWith(
				"INSERT INTO mcqs (id, name, question, created_by_user_id, created_at, updated_at)",
			)
		) {
			const [id, name, question, created_by_user_id, created_at, updated_at] =
				bindings as string[];
			if (!this.users.some((user) => user.id === created_by_user_id)) {
				throw new Error("FOREIGN KEY constraint failed: mcqs.created_by_user_id");
			}
			this.mcqs.push({
				id,
				name,
				question,
				created_by_user_id,
				created_at,
				updated_at,
			});
			return;
		}

		if (
			normalized.startsWith(
				"INSERT INTO mcq_choices (id, mcq_id, choice_text, is_correct, position, created_at, updated_at)",
			)
		) {
			const [
				id,
				mcq_id,
				choice_text,
				is_correct,
				position,
				created_at,
				updated_at,
			] = bindings as (string | number)[];
			if (!this.mcqs.some((mcq) => mcq.id === mcq_id)) {
				throw new Error("FOREIGN KEY constraint failed: mcq_choices.mcq_id");
			}
			this.mcqChoices.push({
				id: id as string,
				mcq_id: mcq_id as string,
				choice_text: choice_text as string,
				is_correct: Number(is_correct),
				position: Number(position),
				created_at: created_at as string,
				updated_at: updated_at as string,
			});
			return;
		}

		if (
			normalized.startsWith(
				"INSERT INTO mcq_attempts (id, mcq_id, user_id, selected_choice_id, is_correct, created_at)",
			)
		) {
			const [id, mcq_id, user_id, selected_choice_id, is_correct, created_at] =
				bindings as (string | number)[];
			if (!this.mcqs.some((mcq) => mcq.id === mcq_id)) {
				throw new Error("FOREIGN KEY constraint failed: mcq_attempts.mcq_id");
			}
			if (!this.users.some((user) => user.id === user_id)) {
				throw new Error("FOREIGN KEY constraint failed: mcq_attempts.user_id");
			}
			const choice = this.mcqChoices.find(
				(item) => item.id === selected_choice_id,
			);
			if (!choice || choice.mcq_id !== mcq_id) {
				throw new Error(
					"FOREIGN KEY constraint failed: mcq_attempts.selected_choice_id",
				);
			}
			this.mcqAttempts.push({
				id: id as string,
				mcq_id: mcq_id as string,
				user_id: user_id as string,
				selected_choice_id: selected_choice_id as string,
				is_correct: Number(is_correct),
				created_at: created_at as string,
			});
			return;
		}

		if (normalized.startsWith("DELETE FROM mcqs WHERE id =")) {
			const [id, createdByUserId] = bindings as string[];
			const mcq = this.mcqs.find((item) => item.id === id);
			if (!mcq) {
				return;
			}
			if (createdByUserId !== undefined && mcq.created_by_user_id !== createdByUserId) {
				return;
			}
			this.mcqAttempts = this.mcqAttempts.filter(
				(attempt) => attempt.mcq_id !== id,
			);
			this.mcqChoices = this.mcqChoices.filter((choice) => choice.mcq_id !== id);
			this.mcqs = this.mcqs.filter((item) => item.id !== id);
			return;
		}

		if (normalized.startsWith("DELETE FROM mcq_choices WHERE mcq_id =")) {
			const [mcq_id] = bindings as string[];
			this.mcqChoices = this.mcqChoices.filter(
				(choice) => choice.mcq_id !== mcq_id,
			);
			return;
		}

		if (normalized.startsWith("DELETE FROM mcq_attempts WHERE mcq_id =")) {
			const [mcq_id] = bindings as string[];
			this.mcqAttempts = this.mcqAttempts.filter(
				(attempt) => attempt.mcq_id !== mcq_id,
			);
		}

		if (
			normalized.startsWith(
				"UPDATE mcqs SET name = ?1, question = ?2, updated_at = ?3 WHERE id = ?4 AND created_by_user_id = ?5",
			)
		) {
			const [name, question, updated_at, id, created_by_user_id] =
				bindings as string[];
			const mcq = this.mcqs.find(
				(item) => item.id === id && item.created_by_user_id === created_by_user_id,
			);
			if (mcq) {
				mcq.name = name;
				mcq.question = question;
				mcq.updated_at = updated_at;
			}
		}
	}

	private query<T>(sql: string, bindings: unknown[]): T[] {
		const normalized = sql.replace(/\s+/g, " ").trim();

		if (
			normalized.includes("FROM users") &&
			normalized.includes("WHERE email =")
		) {
			const [email] = bindings as string[];
			const row = this.users.find((user) => user.email === email);
			return row ? ([row] as T[]) : [];
		}

		if (
			normalized.includes("FROM users") &&
			normalized.includes("WHERE id =")
		) {
			const [id] = bindings as string[];
			const row = this.users.find((user) => user.id === id);
			return row ? ([row] as T[]) : [];
		}

		if (normalized.includes("SELECT 1 AS found FROM users WHERE email =")) {
			const [email] = bindings as string[];
			const found = this.users.some((user) => user.email === email);
			return found ? ([{ found: 1 }] as T[]) : [];
		}

		if (
			normalized.includes("FROM sessions") &&
			normalized.includes("WHERE id =")
		) {
			const [id] = bindings as string[];
			const row = this.sessions.find((session) => session.id === id);
			return row ? ([row] as T[]) : [];
		}

		if (normalized.includes("FROM mcqs") && normalized.includes("WHERE id =")) {
			const [id, createdByUserId] = bindings as string[];
			const row = this.mcqs.find((mcq) => {
				if (mcq.id !== id) {
					return false;
				}
				if (createdByUserId !== undefined) {
					return mcq.created_by_user_id === createdByUserId;
				}
				return true;
			});
			return row ? ([row] as T[]) : [];
		}

		if (
			normalized.includes("FROM mcqs m") &&
			normalized.includes("WHERE m.created_by_user_id =")
		) {
			const [userId] = bindings as string[];
			const rows = this.mcqs
				.filter((mcq) => mcq.created_by_user_id === userId)
				.sort(
					(a, b) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
				)
				.map((mcq) => ({
					...mcq,
					choice_count: this.mcqChoices.filter(
						(choice) => choice.mcq_id === mcq.id,
					).length,
				}));
			return rows as T[];
		}

		if (
			normalized.includes("FROM mcq_choices") &&
			normalized.includes("WHERE mcq_id =") &&
			!normalized.includes("WHERE id =")
		) {
			const [mcq_id] = bindings as string[];
			const rows = this.mcqChoices
				.filter((choice) => choice.mcq_id === mcq_id)
				.sort((a, b) => a.position - b.position);
			return rows as T[];
		}

		if (
			normalized.includes("FROM mcq_choices") &&
			normalized.includes("WHERE id =") &&
			normalized.includes("AND mcq_id =")
		) {
			const [choiceId, mcqId] = bindings as string[];
			const row = this.mcqChoices.find(
				(choice) => choice.id === choiceId && choice.mcq_id === mcqId,
			);
			return row ? ([row] as T[]) : [];
		}

		if (
			normalized.includes("FROM mcq_attempts") &&
			normalized.includes("WHERE mcq_id =")
		) {
			const [mcq_id] = bindings as string[];
			const rows = this.mcqAttempts.filter((attempt) => attempt.mcq_id === mcq_id);
			return rows as T[];
		}

		if (
			normalized.includes("FROM mcq_attempts") &&
			normalized.includes("WHERE id =")
		) {
			const [id] = bindings as string[];
			const row = this.mcqAttempts.find((attempt) => attempt.id === id);
			return row ? ([row] as T[]) : [];
		}

		return [];
	}

	getSessionCount(): number {
		return this.sessions.length;
	}

	getMcqChoiceCount(mcqId?: string): number {
		if (mcqId) {
			return this.mcqChoices.filter((choice) => choice.mcq_id === mcqId).length;
		}
		return this.mcqChoices.length;
	}

	getMcqAttemptCount(mcqId?: string): number {
		if (mcqId) {
			return this.mcqAttempts.filter((attempt) => attempt.mcq_id === mcqId).length;
		}
		return this.mcqAttempts.length;
	}
}

export function createMockD1Database(): D1Database {
	return new MockD1Database() as unknown as D1Database;
}

/** Test helper — not for production use. */
export function getMockSessionCount(db: D1Database): number {
	return (db as unknown as MockD1Database).getSessionCount();
}

/** Test helper — not for production use. */
export function getMockMcqChoiceCount(db: D1Database, mcqId?: string): number {
	return (db as unknown as MockD1Database).getMcqChoiceCount(mcqId);
}

/** Test helper — not for production use. */
export function getMockMcqAttemptCount(db: D1Database, mcqId?: string): number {
	return (db as unknown as MockD1Database).getMcqAttemptCount(mcqId);
}
