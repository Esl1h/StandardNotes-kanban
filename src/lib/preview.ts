import { parseMarkdown } from './parseMarkdown';

export const PREVIEW_LIMIT = 160;

// One line, never empty: an empty preview makes the app show the whole text.
export const truncatePreview = (text: string): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat === '') {
    return ' ';
  }
  return flat.length > PREVIEW_LIMIT
    ? `${flat.slice(0, PREVIEW_LIMIT - 1)}…`
    : flat;
};

/** "Todo (3) · Doing (1) · Done (5)" for the notes list. */
export const boardPreview = (markdown: string): string => {
  try {
    const { boardData } = parseMarkdown(markdown);
    const lanes = boardData.lanes.map(
      (lane) => `${lane.title} (${lane.cards.length})`
    );
    return truncatePreview(lanes.length > 0 ? lanes.join(' · ') : markdown);
  } catch {
    return truncatePreview(markdown);
  }
};
