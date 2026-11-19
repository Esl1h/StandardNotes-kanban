/**
 * Short, human-tolerable ids persisted inside the note as
 * "[id:xxxxxx]" markers after lane and card titles. They keep drag and
 * modal references stable between loads instead of regenerating UUIDs
 * on every note open.
 */

// A backslash before the bracket escapes it, see escapeTitle.
const MARKER_PATTERN = /\s*(?<!\\)\[id:([a-z0-9]{4,8})\]\s*$/i;
const LOOKALIKE = /\[(done|id:[a-z0-9]{4,8})\]/gi;
const ESCAPED_LOOKALIKE = /\\\[(done|id:[a-z0-9]{4,8})\]/gi;

export const shortId = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

/** Splits a raw title into the display title and its persisted id, if any. */
export const stripIdMarker = (title: string): { title: string; id?: string } => {
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

/**
 * Keeps a typed title from being read back as a "[done]" or "[id:x]"
 * marker (which would mark the lane done or collide with another id).
 */
export const escapeTitle = (title: string): string => title.replace(LOOKALIKE, '\\[$1]');

/** Undoes escapeTitle; run after the markers have been stripped. */
export const unescapeTitle = (title: string): string => title.replace(ESCAPED_LOOKALIKE, '[$1]');
