import { KanbanBoard } from './kanban';


export interface EditorInterface {
  boardData: KanbanBoard;
  parsingErrors: ParsingErrors[];
  /** Unrecognized lines found before the first lane, kept at the top. */
  preamble?: string[];
}

export interface ParsingErrors {
  message: string;
  lineIndex: number;
  lineText: string;
  laneIndex?: number;
  cardIndex?: number;
}
