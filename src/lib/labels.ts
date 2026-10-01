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

export const chipStyle = (color?: string): React.CSSProperties =>
  color ? { backgroundColor: color, color: '#fff' } : {};

export interface DueBadge {
  text: string;
  className: string;
}

/** Classifies a due date for badge styling: overdue, today, soon or plain. */
export const dueBadge = (due?: string): DueBadge | null => {
  if (!due) {
    return null;
  }
  const parsed = new Date(`${due}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { text: due, className: 'kbn-due-plain' };
  }
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dayDiff = Math.round(
    (parsed.getTime() - today.getTime()) / 86400000
  );
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
