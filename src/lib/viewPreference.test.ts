import { PreferenceStore, readView, writeView } from './viewPreference';

const memoryStore = (initial: Record<string, unknown> = {}) => {
  const data = { ...initial };
  const store: PreferenceStore = {
    get: (key) => data[key],
    set: (key, value) => {
      data[key] = value;
    },
  };
  return { store, data };
};

const brokenStore: PreferenceStore = {
  get: () => {
    throw new Error('The component has not been initialized.');
  },
  set: () => {
    throw new Error('The component has not been initialized.');
  },
};

afterEach(() => {
  localStorage.clear();
});

test('shows the board for a note without a saved view', () => {
  expect(readView(memoryStore().store, 'n1')).toBe('board');
  expect(readView(undefined, 'n1')).toBe('board');
  expect(readView(memoryStore().store, undefined)).toBe('board');
});

test('the store has priority over localStorage', () => {
  localStorage.setItem('kbn-view:n1', 'board');
  const { store } = memoryStore({ views: { n1: 'matrix' } });

  expect(readView(store, 'n1')).toBe('matrix');
});

test('falls back to localStorage when the store has no entry', () => {
  localStorage.setItem('kbn-view:n1', 'matrix');

  expect(readView(memoryStore().store, 'n1')).toBe('matrix');
});

test('writes to the store and to localStorage', () => {
  const { store, data } = memoryStore();

  writeView(store, 'n1', 'matrix');

  expect(data.views).toEqual({ n1: 'matrix' });
  expect(localStorage.getItem('kbn-view:n1')).toBe('matrix');
});

test('going back to the board erases the entry', () => {
  const { store, data } = memoryStore({
    views: { n1: 'matrix', n2: 'matrix' },
  });

  writeView(store, 'n1', 'board');

  expect(data.views).toEqual({ n2: 'matrix' });
  expect(readView(store, 'n1')).toBe('board');
});

test('keeps the 200 most recent matrix notes', () => {
  const { store, data } = memoryStore();

  for (let i = 0; i < 205; i++) {
    writeView(store, `note${i}`, 'matrix');
  }

  const kept = Object.keys(data.views as Record<string, string>);
  expect(kept).toHaveLength(200);
  expect(kept[0]).toBe('note5');
  expect(kept[199]).toBe('note204');
});

test('a note put in matrix again counts as the most recent', () => {
  const { store, data } = memoryStore();
  writeView(store, 'a', 'matrix');
  writeView(store, 'b', 'matrix');

  writeView(store, 'a', 'matrix');

  expect(Object.keys(data.views as Record<string, string>)).toEqual(['b', 'a']);
});

test('uses localStorage alone when the store throws', () => {
  writeView(brokenStore, 'n1', 'matrix');

  expect(readView(brokenStore, 'n1')).toBe('matrix');
});

test('ignores a stored value that is not a map of views', () => {
  const { store } = memoryStore({ views: 'matrix' });

  expect(readView(store, 'n1')).toBe('board');
  expect(() => writeView(store, 'n1', 'matrix')).not.toThrow();
});

test('writes nothing for a note without an id', () => {
  const { store, data } = memoryStore();

  writeView(store, undefined, 'matrix');

  expect(data.views).toBeUndefined();
  expect(localStorage.length).toBe(0);
});
