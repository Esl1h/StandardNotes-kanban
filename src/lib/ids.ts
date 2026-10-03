/**
 * Short, human-tolerable ids persisted inside the note as
 * "[id:xxxxxx]" markers after lane and card titles. They keep drag and
 * modal references stable between loads instead of regenerating UUIDs
 * on every note open.
 */

const MARKER_PATTERN = /\s*\[id:([a-z0-9]{4,8})\]\s*$/i;

export const shortId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

/** Splits a raw title into the display title and its persisted id, if any. */
export const stripIdMarker = (
  title: string
): { title: string; id?: string } => {
  const match = title.match(MARKER_PATTERN);
  if (!match) {
    return { title: title.trim() };
  }
  return {
    title: title.replace(MARKER_PATTERN, '').trim(),
    id: match[1].toLowerCase(),
  };
};

/** Joins a display title with its id marker, if the entity has one. */
export const withIdMarker = (title: string, id?: string): string =>
  id ? `${title} [id:${id}]` : title;
