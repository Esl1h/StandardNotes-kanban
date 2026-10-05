import { chipStyle, labelChips } from './labels';

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

test('splits a comma separated label and trims the names', () => {
  expect(labelChips(' red , urgent ,').map((chip) => chip.name)).toEqual([
    'red',
    'urgent',
  ]);
  expect(labelChips(undefined)).toEqual([]);
});
