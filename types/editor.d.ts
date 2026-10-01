import { KanbanBoard } from './kanban';


export interface EditorInterface {
  boardData: KanbanBoard;
  parsingErrors: ParsingErrors[];
}

export interface ParsingErrors {
  message: string;
  lineIndex: number;
  lineText: string;
  laneIndex?: number;
  cardIndex?: number;
}
