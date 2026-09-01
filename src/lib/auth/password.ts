import { PASSWORD_HASH_ITERATIONS } from "@/lib/auth/config";

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
	const binary = atob(value);
	const buffer = new ArrayBuffer(binary.length);
	const bytes = new Uint8Array(buffer);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

async function deriveKey(
	password: string,
	salt: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PASSWORD_HASH_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);

	return new Uint8Array(bits);
}

/** Returns a stored hash string; never store or log the plain password. */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
	const hash = await deriveKey(password, salt);
	return `pbkdf2:${PASSWORD_HASH_ITERATIONS}:${toBase64(salt)}:${toBase64(hash)}`;
}

export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	const parts = storedHash.split(":");
	if (parts.length !== 4 || parts[0] !== "pbkdf2") {
		return false;
	}

	const iterations = Number(parts[1]);
	const salt = fromBase64(parts[2]);
	const expectedHash = fromBase64(parts[3]);

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		encoder.encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);

	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		256,
	);

	const actualHash = new Uint8Array(bits);
	if (actualHash.length !== expectedHash.length) {
		return false;
	}

	return actualHash.every((byte, index) => byte === expectedHash[index]);
}

/** True when the stored value is a hash, not plain text. */
export function isPasswordHashed(storedValue: string): boolean {
	return storedValue.startsWith("pbkdf2:");
}
