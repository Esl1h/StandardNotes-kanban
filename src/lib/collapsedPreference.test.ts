import { PreferenceStore } from './viewPreference';
import { readCollapsed, writeCollapsed } from './collapsedPreference';

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

test('no lane is collapsed for a note without a saved state', () => {
  expect(readCollapsed(memoryStore().store, 'n1').size).toBe(0);
  expect(readCollapsed(undefined, 'n1').size).toBe(0);
  expect(readCollapsed(memoryStore().store, undefined).size).toBe(0);
});

test('the store has priority over localStorage', () => {
  localStorage.setItem('kbn-collapsed:n1', JSON.stringify(['b']));
  const { store } = memoryStore({ collapsed: { n1: ['a'] } });

  expect([...readCollapsed(store, 'n1')]).toEqual(['a']);
});

test('falls back to localStorage when the store has no entry', () => {
  localStorage.setItem('kbn-collapsed:n1', JSON.stringify(['b']));

  expect([...readCollapsed(memoryStore().store, 'n1')]).toEqual(['b']);
});

test('writes to the store and to localStorage', () => {
  const { store, data } = memoryStore();

  writeCollapsed(store, 'n1', new Set(['a', 'c']));

  expect(data.collapsed).toEqual({ n1: ['a', 'c'] });
  expect(localStorage.getItem('kbn-collapsed:n1')).toBe('["a","c"]');
});

test('expanding every lane erases the entry', () => {
  const { store, data } = memoryStore({
    collapsed: { n1: ['a'], n2: ['b'] },
  });

  writeCollapsed(store, 'n1', new Set());

  expect(data.collapsed).toEqual({ n2: ['b'] });
  expect([...readCollapsed(store, 'n1')]).toEqual([]);
});

test('keeps the 200 most recent notes', () => {
  const { store, data } = memoryStore();

  for (let i = 0; i < 205; i++) {
    writeCollapsed(store, `note${i}`, new Set(['a']));
  }

  const kept = Object.keys(data.collapsed as Record<string, string[]>);
  expect(kept).toHaveLength(200);
  expect(kept[0]).toBe('note5');
  expect(kept[199]).toBe('note204');
});

test('uses localStorage alone when the store throws', () => {
  writeCollapsed(brokenStore, 'n1', new Set(['a']));

  expect([...readCollapsed(brokenStore, 'n1')]).toEqual(['a']);
});

test('ignores stored values that are not a list of ids', () => {
  const { store } = memoryStore({ collapsed: { n1: 'a', n2: [1, 'b'] } });
  localStorage.setItem('kbn-collapsed:n3', '{"x":1}');

  expect(readCollapsed(store, 'n1').size).toBe(0);
  expect([...readCollapsed(store, 'n2')]).toEqual(['b']);
  expect(readCollapsed(store, 'n3').size).toBe(0);
  expect(() =>
    writeCollapsed(memoryStore({ collapsed: 'x' }).store, 'n1', new Set(['a']))
  ).not.toThrow();
});

test('writes nothing for a note without an id', () => {
  const { store, data } = memoryStore();

  writeCollapsed(store, undefined, new Set(['a']));

  expect(data.collapsed).toBeUndefined();
  expect(localStorage.length).toBe(0);
});
