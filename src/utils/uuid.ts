/**
 * Generate a random UUID v4
 */
export function uuidv4(): string {
    return crypto.randomUUID();
}
