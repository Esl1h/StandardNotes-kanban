import { chipStyle, isoDate, labelChips, LABEL_COLORS } from './labels';

// WCAG relative luminance and contrast ratio, computed here on purpose and
// not taken from the code under test.
const luminance = (color: string): number => {
  // "#fff" is as valid as "#ffffff".
  const hex = color.length === 4 ? color.replace(/\w/g, '$&$&') : color;
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const palette = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

test.each(palette)('the %s chip text meets WCAG AA', (name) => {
  const [chip] = labelChips(name);
  const style = chipStyle(chip.color);

  expect(
    contrast(style.backgroundColor as string, style.color as string)
  ).toBeGreaterThanOrEqual(4.5);
});

test('a name outside the palette gets a neutral chip', () => {
  const [chip] = labelChips('urgent');

  expect(chip).toEqual({ name: 'urgent', color: undefined });
  expect(chipStyle(chip.color)).toEqual({});
});

test.each(['constructor', 'toString', '__proto__'])(
  'the label %s is a neutral chip, not an inherited property',
  (name) => {
    expect(labelChips(name)).toEqual([{ name, color: undefined }]);
    expect(labelChips(name, {})).toEqual([{ name, color: undefined }]);
  }
);

test('an assigned color that is no palette name is ignored', () => {
  expect(labelChips('x', { x: 'constructor' })).toEqual([
    { name: 'x', color: undefined },
  ]);
});

test('an assigned color wins over the name and the palette', () => {
  const [chip] = labelChips('urgent', { urgent: 'purple' });

  expect(chip).toEqual({ name: 'urgent', color: LABEL_COLORS.purple });
});

test('a label name still colors itself without an assignment', () => {
  const [chip] = labelChips('Red', {});

  expect(chip).toEqual({ name: 'Red', color: LABEL_COLORS.red });
});

test('an assignment with an unknown color renders neutral', () => {
  const [chip] = labelChips('urgent', { urgent: 'chartreuse' });

  expect(chip).toEqual({ name: 'urgent', color: undefined });
});

test('splits a comma separated label and trims the names', () => {
  expect(labelChips(' red , urgent ,').map((chip) => chip.name)).toEqual([
    'red',
    'urgent',
  ]);
  expect(labelChips(undefined)).toEqual([]);
});

describe('isoDate', () => {
  test('formats the local day, offset from the given date', () => {
    expect(isoDate(0, new Date(2026, 0, 31))).toBe('2026-01-31');
    expect(isoDate(1, new Date(2026, 0, 31))).toBe('2026-02-01');
    expect(isoDate(-1, new Date(2026, 2, 1))).toBe('2026-02-28');
  });

  test('pads month and day', () => {
    expect(isoDate(0, new Date(2026, 10, 5))).toBe('2026-11-05');
  });
});
