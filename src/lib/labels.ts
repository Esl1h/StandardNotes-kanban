import React from 'react';

/**
 * Label chips: a card label is a comma separated free-text string.
 * Names matching this palette render as colored chips; anything else
 * renders as a neutral chip, so existing notes keep working.
 */
const LABEL_COLORS: Record<string, string> = {
  red: '#e05252',
  orange: '#e8871e',
  yellow: '#d9a800',
  green: '#2b9612',
  blue: '#086dd6',
  purple: '#7b3ff2',
  pink: '#e64980',
};

export interface LabelChip {
  name: string;
  color?: string;
}

export const labelChips = (label?: string): LabelChip[] =>
  (label || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, color: LABEL_COLORS[name.toLowerCase()] }));

// WCAG relative luminance of a "#rrggbb" color.
const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Black or white, whichever reads better on `background`. Picking the
 * better of the two always reaches a 4.58 contrast ratio, above the 4.5 of
 * WCAG AA; white on the yellow, orange and green chips was between 2.2
 * and 3.8.
 */
const readableText = (background: string): string => {
  const lum = luminance(background);
  const whiteContrast = 1.05 / (lum + 0.05);
  const blackContrast = (lum + 0.05) / 0.05;
  return whiteContrast >= blackContrast ? '#ffffff' : '#000000';
};

export const chipStyle = (color?: string): React.CSSProperties =>
  color ? { backgroundColor: color, color: readableText(color) } : {};

export interface DueBadge {
  text: string;
  className: string;
}

/**
 * Whole days from `now` to the due date (negative once it has passed), or
 * null when there is no date or it is not a valid YYYY-MM-DD one. Both ends
 * are taken at noon so a daylight saving change cannot shift the count.
 */
export const daysUntil = (
  due?: string,
  now: Date = new Date()
): number | null => {
  if (!due) {
    return null;
  }
  const parsed = new Date(`${due}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return Math.round((parsed.getTime() - today.getTime()) / 86400000);
};

/** Classifies a due date for badge styling: overdue, today, soon or plain. */
export const dueBadge = (due?: string): DueBadge | null => {
  if (!due) {
    return null;
  }
  const dayDiff = daysUntil(due);
  if (dayDiff === null) {
    return { text: due, className: 'kbn-due-plain' };
  }
  if (dayDiff < 0) {
    return { text: due, className: 'kbn-due-overdue' };
  }
  if (dayDiff === 0) {
    return { text: 'Due today', className: 'kbn-due-today' };
  }
  if (dayDiff === 1) {
    return { text: 'Due tomorrow', className: 'kbn-due-soon' };
  }
  return { text: due, className: 'kbn-due-plain' };
};
