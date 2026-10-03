import { shortId, stripIdMarker, withIdMarker } from './ids';

test('generates six character lowercase ids', () => {
  const id = shortId();
  expect(id).toMatch(/^[a-z0-9]{6}$/);
});

test('generates different ids on each call', () => {
  const ids = new Set(Array.from({ length: 200 }, () => shortId()));
  // 24 bits of randomness: even one collision in 200 draws is unlikely.
  expect(ids.size).toBeGreaterThan(190);
});

test('strips a trailing id marker from a title', () => {
  const { title, id } = stripIdMarker('Renew passport [id:a3f9k2]');
  expect(title).toBe('Renew passport');
  expect(id).toBe('a3f9k2');
});

test('keeps titles that merely contain brackets mid-string', () => {
  const { title, id } = stripIdMarker('Buy [milk] tomorrow');
  expect(title).toBe('Buy [milk] tomorrow');
  expect(id).toBeUndefined();
});

test('joins a title with its id marker', () => {
  expect(withIdMarker('Renew passport', 'a3f9k2')).toBe(
    'Renew passport [id:a3f9k2]'
  );
  expect(withIdMarker('Renew passport')).toBe('Renew passport');
});
