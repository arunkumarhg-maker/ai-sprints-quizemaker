/** Resolved during Phase 1 — see ai-workspace/QUIZ_MAKER_TECHNICAL_PRD.md (Open Questions, Phase 1 Infrastructure Choices). */

/** Maximum Full Name length (Q-4). */
export const FULL_NAME_MAX_LENGTH = 100;

/** Absolute session lifetime: 7 days (Q-1). */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** PBKDF2 iterations for password hashing. */
export const PASSWORD_HASH_ITERATIONS = 100_000;
