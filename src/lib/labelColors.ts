import { LABEL_COLORS, LabelColors } from './labels';

/** The palette in swatch order, name and hex per entry. */
export const LABEL_PALETTE = Object.entries(LABEL_COLORS).map(
  ([name, hex]) => ({ name, hex })
);

/**
 * Parses the note's "Labels:" value, "urgent=red, work=blue". Every
 * entry must name a palette color, or the whole text is refused (null)
 * so the parser keeps the line as unread instead of silently dropping
 * what was hand-written. Label names keep their case and spaces.
 */
export const parseLabelColors = (text: string): LabelColors | null => {
  const colors: LabelColors = {};
  for (const pair of text.split(',')) {
    const match = /^([^=]+?)\s*=\s*(\S+)$/.exec(pair.trim());
    const color = match?.[2].toLowerCase();
    if (!match?.[1].trim() || !color || !LABEL_COLORS[color]) {
      return null;
    }
    colors[match[1].trim()] = color;
  }
  return Object.keys(colors).length > 0 ? colors : null;
};

/**
 * Back to "urgent=red, work=blue", in assignment order. Entries that
 * could not be parsed back (a "=" in the name, an unknown color) are
 * left out.
 */
export const formatLabelColors = (colors: LabelColors): string =>
  Object.entries(colors)
    .filter(
      ([name, color]) => name && !name.includes('=') && !!LABEL_COLORS[color]
    )
    .map(([name, color]) => `${name}=${color}`)
    .join(', ');
