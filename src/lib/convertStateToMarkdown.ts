import { withIdMarker } from './ids';
import { KanbanBoard, KanbanCard } from '../../types/kanban';
import { EditorInterface, ParsingErrors } from '../../types/editor';

export const convertStateToMarkdown = (state: EditorInterface): string => {
  const { boardData, parsingErrors } = state;

  const boardText = convertBoardData(boardData);
  const errorText = convertParsingErrors(parsingErrors);
  return `${boardText}${errorText}`;
};

const convertParsingErrors = (parsingErrors: ParsingErrors[]): string => {
  const errorText = parsingErrors.map((error) => error.lineText).join('\n');
  return addNewlineIfNotEmpty(errorText);
};

const convertBoardData = (boardData: KanbanBoard): string => {
  const boardText = boardData.lanes
    .map(
      (lane) =>
        `# ${withIdMarker(lane.title, lane.id)}\n${convertCards(lane.cards)}`
    )
    .join('\n\n');
  return addNewlineIfNotEmpty(boardText);
};

const convertCards = (cards: Array<KanbanCard>): string =>
  cards
    .map((card) => {
      const lines: string[] = [];
      if (card.description) {
        const [first, ...rest] = card.description.split('\n');
        lines.push(`  * Description: ${first}`);
        rest.forEach((text) => lines.push(`    > ${text}`));
      }
      if (card.due) {
        lines.push(`  * Due: ${card.due}`);
      }
      if (card.label) {
        lines.push(`  * Label: ${card.label}`);
      }
      if (card.checklist && card.checklist.length > 0) {
        lines.push('  * Checklist:');
        card.checklist.forEach((item) =>
          lines.push(`    [${item.done ? 'x' : ' '}] ${item.text}`)
        );
      }
      if (card.comments && card.comments.length > 0) {
        lines.push('  * Comments:');
        card.comments.forEach((comment) => lines.push(`    * ${comment}`));
      }
      return `* ${withIdMarker(card.title, card.id)}${
        lines.length > 0 ? `\n${lines.join('\n')}` : ''
      }`;
    })
    .join('\n');

const addNewlineIfNotEmpty = (text: string): string => {
  return text ? `${text}\n` : '';
};
