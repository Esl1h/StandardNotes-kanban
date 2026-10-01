import { KanbanBoard } from './kanban';


export interface EditorInterface {
  boardData: KanbanBoard;
  editorConfig: EditorConfig;
  parsingErrors: ParsingErrors[];
}

export interface EditorConfig {}

export interface ParsingErrors {
  message: string;
  lineIndex: number;
  lineText: string;
  laneIndex?: number;
  cardIndex?: number;
}
