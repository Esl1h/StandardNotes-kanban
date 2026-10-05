import { PreferenceStore } from './viewPreference';

// One key holds the collapsed lanes of every note that has any, so the
// component data does not grow a key per note; only the most recent notes
// are kept. Lane ids are the `[id:x]` markers of the note.
const STORE_KEY = 'collapsed';
const MAX_NOTES = 200;

// localStorage is the fallback, per device: collapsing a lane should not
// save the note.
const collapsedKey = (noteId: string) => `kbn-collapsed:${noteId}`;

const idsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string')
    : [];

const entriesOf = (store?: PreferenceStore): Record<string, unknown> => {
  try {
    const stored = store?.get(STORE_KEY);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return stored as Record<string, unknown>;
    }
  } catch {
    // Not registered yet; localStorage below.
  }
  return {};
};

export const readCollapsed = (
  store: PreferenceStore | undefined,
  noteId?: string
): ReadonlySet<string> => {
  if (!noteId) {
    return new Set();
  }
  const synced = idsOf(entriesOf(store)[noteId]);
  if (synced.length > 0) {
    return new Set(synced);
  }
  try {
    const stored = localStorage.getItem(collapsedKey(noteId));
    return new Set(idsOf(stored ? JSON.parse(stored) : []));
  } catch {
    return new Set();
  }
};

export const writeCollapsed = (
  store: PreferenceStore | undefined,
  noteId: string | undefined,
  collapsed: ReadonlySet<string>
): void => {
  if (!noteId) {
    return;
  }
  const ids = [...collapsed];
  try {
    if (store) {
      // Only notes with a collapsed lane are stored; a note written again
      // moves to the end, which is where the oldest are cut from the front.
      const entries = { ...entriesOf(store) };
      delete entries[noteId];
      if (ids.length > 0) {
        entries[noteId] = ids;
      }
      store.set(
        STORE_KEY,
        Object.fromEntries(Object.entries(entries).slice(-MAX_NOTES))
      );
    }
  } catch {
    // Not registered yet; localStorage below still keeps it.
  }
  try {
    localStorage.setItem(collapsedKey(noteId), JSON.stringify(ids));
  } catch {
    // The lanes just won't be remembered.
  }
};
