import { KanbanBoard } from '../../types/kanban';

const boardData: KanbanBoard = {
  lanes: [
    {
      title: 'Lane 1',
      cards: [
        {
          title: 'Card 1',
          description: 'desc',
          label: 'label',
        },
      ],
    },
  ],
};

export default boardData;
