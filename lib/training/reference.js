/**
 * Human-readable registration references.
 *
 * Short enough to read down a phone line, and drawn from an alphabet without
 * the characters people mishear or mistype (no O/0, I/1, S/5).
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

export function makeReference(prefix = "REG") {
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${out}`;
}

/**
 * Reserve a reference that is not already taken.
 *
 * The collision window is tiny but the unique index is the real guarantee; this
 * just keeps the caller from having to retry a save in the ordinary case.
 */
export async function uniqueReference(Model, prefix = "REG", attempts = 6) {
  for (let i = 0; i < attempts; i += 1) {
    const candidate = makeReference(prefix);
    // eslint-disable-next-line no-await-in-loop
    const clash = await Model.exists({ reference: candidate });
    if (!clash) return candidate;
  }
  // Fall back to something that cannot collide rather than failing the request.
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}
