export interface KanbanChecklistItem {
  done: boolean;
  text: string;
}
export interface KanbanCard {
  id?: string;
  title: string;
  description?: string;
  label?: string;
  due?: string;
  laneId?: string;
  checklist?: Array<KanbanChecklistItem>;
  comments?: Array<string>;
}
export interface KanbanLane {
  id?: string;
  title: string;
  cards: Array<KanbanCard>;
}
export interface KanbanBoard {
  lanes: Array<KanbanLane>;
}
