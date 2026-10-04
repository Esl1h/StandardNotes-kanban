export type View = 'board' | 'matrix';

/** Key/value store backed by the Standard Notes component data. */
export interface PreferenceStore {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}

// One key holds every note in matrix, so the component data does not grow
// a key per note; only the most recent ones are kept.
const STORE_KEY = 'views';
const MAX_VIEWS = 200;

// localStorage is the fallback, per device: switching views should not save
// the note.
const viewKey = (noteId: string) => `kbn-view:${noteId}`;

const viewsOf = (store?: PreferenceStore): Record<string, string> => {
  try {
    const stored = store?.get(STORE_KEY);
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return stored as Record<string, string>;
    }
  } catch {
    // Not registered yet; localStorage below.
  }
  return {};
};

export const readView = (
  store: PreferenceStore | undefined,
  noteId?: string
): View => {
  if (!noteId) {
    return 'board';
  }
  if (viewsOf(store)[noteId] === 'matrix') {
    return 'matrix';
  }
  try {
    return localStorage.getItem(viewKey(noteId)) === 'matrix'
      ? 'matrix'
      : 'board';
  } catch {
    return 'board';
  }
};

export const writeView = (
  store: PreferenceStore | undefined,
  noteId: string | undefined,
  view: View
): void => {
  if (!noteId) {
    return;
  }
  try {
    if (store) {
      // Only notes in matrix are stored; a note put there again moves to
      // the end, which is where the oldest are cut from the front.
      const views = { ...viewsOf(store) };
      delete views[noteId];
      if (view === 'matrix') {
        views[noteId] = 'matrix';
      }
      const kept = Object.entries(views).slice(-MAX_VIEWS);
      store.set(STORE_KEY, Object.fromEntries(kept));
    }
  } catch {
    // Not registered yet; localStorage below still keeps it.
  }
  try {
    localStorage.setItem(viewKey(noteId), view);
  } catch {
    // The view just won't be remembered.
  }
};
