import {
  formatLabelColors,
  LABEL_PALETTE,
  parseLabelColors,
} from './labelColors';
import { LABEL_COLORS } from './labels';

test('the palette mirrors the color table', () => {
  expect(Object.fromEntries(LABEL_PALETTE.map((e) => [e.name, e.hex]))).toEqual(
    LABEL_COLORS
  );
});

test('parses name=color pairs, trimming around them', () => {
  expect(parseLabelColors('urgent=red, work = blue')).toEqual({
    urgent: 'red',
    work: 'blue',
  });
});

test('keeps the label name case and its spaces', () => {
  expect(parseLabelColors('Home Improvement=green')).toEqual({
    'Home Improvement': 'green',
  });
});

test('refuses the whole text when a pair misses the palette', () => {
  expect(parseLabelColors('urgent=chartreuse, work=blue')).toBeNull();
});

test('refuses the whole text when an entry has no pair', () => {
  expect(parseLabelColors('urgent, work=blue, =red')).toBeNull();
});

test('colors are case insensitive and lowercased on parse', () => {
  expect(parseLabelColors('urgent=RED')).toEqual({ urgent: 'red' });
});

test('an empty value is refused', () => {
  expect(parseLabelColors('')).toBeNull();
  expect(parseLabelColors('no pairs here')).toBeNull();
});

test('formats back in assignment order', () => {
  const colors = parseLabelColors('work=blue, urgent=red')!;
  expect(formatLabelColors(colors)).toBe('work=blue, urgent=red');
});

test('format leaves out entries that would not parse back', () => {
  expect(formatLabelColors({ 'a=b': 'red', ok: 'blue' })).toBe('ok=blue');
  expect(formatLabelColors({ broken: 'chartreuse' })).toBe('');
});

test('names inherited by every object are not palette colors', () => {
  expect(parseLabelColors('x=constructor')).toBeNull();
  expect(parseLabelColors('x=__proto__')).toBeNull();
  expect(formatLabelColors({ x: 'constructor', ok: 'blue' })).toBe('ok=blue');
});
