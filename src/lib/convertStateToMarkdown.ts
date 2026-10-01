import { KanbanBoard, KanbanCard } from '../../types/kanban';
import {
  EditorConfig,
  EditorInterface,
  ParsingErrors,
} from '../../types/editor';

export const convertStateToMarkdown = (state: EditorInterface): string => {
  const { boardData, editorConfig, parsingErrors } = state;

  const boardText = convertBoardData(boardData);
  const configText = convertEditorConfig(editorConfig);
  const errorText = convertParsingErrors(parsingErrors);
  return `${boardText}${configText}${errorText}`;
};

const convertParsingErrors = (parsingErrors: ParsingErrors[]): string => {
  const errorText = parsingErrors.map((error) => error.lineText).join('\n');
  return addNewlineIfNotEmpty(errorText);
};

const convertEditorConfig = (_config: EditorConfig): string => {
  const configText = '';
  return addNewlineIfNotEmpty(configText);
};

const convertBoardData = (boardData: KanbanBoard): string => {
  const boardText = boardData.lanes
    .map((lane) => `# ${lane.title}\n${convertCards(lane.cards)}`)
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
      if (card.comments && card.comments.length > 0) {
        lines.push('  * Comments:');
        card.comments.forEach((comment) => lines.push(`    * ${comment}`));
      }
      return `* ${card.title}${lines.length > 0 ? `\n${lines.join('\n')}` : ''}`;
    })
    .join('\n');

const addNewlineIfNotEmpty = (text: string): string => {
  return text ? `${text}\n` : '';
};
