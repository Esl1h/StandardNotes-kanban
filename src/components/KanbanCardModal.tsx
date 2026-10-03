import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { IconMessage, IconCircleX, IconX } from '@tabler/icons-react';
import { chipStyle, dueBadge, labelChips } from '../lib/labels';
import { QUADRANTS, QuadrantNames, toQuadrant } from '../lib/quadrants';
import {
  KanbanCard,
  KanbanChecklistItem,
  KanbanLane,
} from '../../types/kanban';

const CardComment = ({
  comment,
  deleteComment,
}: {
  comment: string;
  deleteComment: () => void;
}) => (
  <div
    className="card-comment"
    style={{
      backgroundColor: 'var(--sn-stylekit-secondary-contrast-background-color)',
      color: 'var(--sn-stylekit-secondary-contrast-foreground-color)',
      border: '1px solid var(--sn-stylekit-secondary-contrast-border-color)',
      marginBottom: '1em',
      padding: '0.5em',
    }}
  >
    <IconMessage size={14} stroke={1} />
    <span style={{ paddingLeft: '0.5em' }}>{comment}</span>
    <button
      style={{ float: 'right', border: '0', background: 'transparent' }}
      onClick={deleteComment}
      className="comment-remove-button"
      aria-label="Remove comment"
    >
      <IconCircleX size={14} stroke={1} />
    </button>
  </div>
);

const NoComments = () => (
  <div>
    <span style={{ fontStyle: 'italic' }}>No Comments yet...</span>
  </div>
);

const ChecklistSection = ({
  checklist,
  onUpdate,
}: {
  checklist: KanbanChecklistItem[];
  onUpdate: (checklist: KanbanChecklistItem[]) => void;
}) => {
  const [newItem, setNewItem] = useState('');
  const addItem = () => {
    if (!newItem.trim()) {
      return;
    }
    onUpdate([...checklist, { done: false, text: newItem.trim() }]);
    setNewItem('');
  };
  const toggleItem = (index) => {
    onUpdate(
      checklist.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item
      )
    );
  };
  const removeItem = (index) => {
    onUpdate(checklist.filter((_, i) => index !== i));
  };
  const done = checklist.filter((item) => item.done).length;
  return (
    <div style={{ marginTop: '1em' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <span style={{ fontWeight: 'bold' }}>Checklist</span>
        <span style={{ fontSize: '0.85em', opacity: 0.7 }}>
          {done}/{checklist.length}
        </span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5em' }}>
        {checklist.map((item: KanbanChecklistItem, i: number) => (
          <li
            key={`${i}-${item.text}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5em',
              padding: '0.25em 0',
              textDecoration: item.done ? 'line-through' : 'none',
              opacity: item.done ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggleItem(i)}
              aria-label={`Mark ${item.text} as ${
                item.done ? 'undone' : 'done'
              }`}
            />
            <span style={{ flex: 1 }}>{item.text}</span>
            <button
              type="button"
              className="comment-remove-button"
              style={{ border: '0', background: 'transparent' }}
              onClick={() => removeItem(i)}
              aria-label={`Remove checklist item ${item.text}`}
            >
              <IconX size={14} stroke={1} />
            </button>
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '0.5em', marginTop: '0.5em' }}>
        <input
          placeholder="New checklist item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addItem();
              e.preventDefault();
            }
          }}
          style={{ flex: 1 }}
        />
        <button onClick={addItem}>Add Item</button>
      </div>
    </div>
  );
};

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(600px, 92vw)',
    maxHeight: '85vh',
    overflowY: 'auto',
    backgroundColor: 'var(--sn-stylekit-contrast-background-color)',
    color: 'var(--sn-stylekit-contrast-foreground-color)',
    borderColor: 'var(--sn-stylekit-contrast-border-color)',
    borderWidth: '3px',
    borderRadius: '8px',
  },
};

interface KanbanCardModalProps {
  card: KanbanCard;
  lanes: KanbanLane[];
  laneId: string;
  quadrantNames: QuadrantNames;
  hideModal: () => void;
  updateCard: (patch: Partial<KanbanCard>) => void;
  onMove: (laneId: string) => void;
}

export const KanbanCardModal = ({
  card,
  hideModal,
  updateCard,
  lanes,
  laneId,
  quadrantNames,
  onMove,
}: KanbanCardModalProps) => {
  const { title, description, label, due, checklist, comments } = card;
  const [newComment, setNewComment] = useState('');
  const [updatedComments, setUpdatedComments] = useState(comments || []);
  const [updatedChecklist, setUpdatedChecklist] = useState(checklist || []);
  const [updatedDescription, setUpdatedDescription] = useState(
    description || ''
  );
  const [updatedDue, setUpdatedDue] = useState(due || '');
  const [updatedLabel, setUpdatedLabel] = useState(label || '');
  const [updatedQuadrant, setUpdatedQuadrant] = useState(card.quadrant ?? '');
  const addComment = () => {
    if (!newComment.trim()) {
      return;
    }
    setUpdatedComments([...updatedComments, newComment]);
    setNewComment('');
  };
  const deleteCommentByIndex = (index) => {
    setUpdatedComments(updatedComments.filter((_, i) => index !== i));
  };
  const closeModal = () => {
    updateCard({
      description: updatedDescription,
      due: updatedDue,
      label: updatedLabel,
      quadrant: toQuadrant(updatedQuadrant),
      checklist: updatedChecklist,
      comments: updatedComments,
    });
    hideModal();
  };

  return (
    <ReactModal
      isOpen
      onRequestClose={closeModal}
      style={customStyles}
      appElement={document.getElementById('sn-component') ?? undefined}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5em',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{title}</span>
        {due && (
          <span className={`kbn-due ${dueBadge(due)?.className}`}>
            {dueBadge(due)?.text}
          </span>
        )}
        {labelChips(label).map((chip) => (
          <span
            key={chip.name}
            className="kbn-card-chip"
            style={chipStyle(chip.color)}
          >
            {chip.name}
          </span>
        ))}
        <button
          type="button"
          className="kbn-icon-btn"
          style={{ marginLeft: 'auto' }}
          aria-label="Save and close"
          title="Save and close"
          onClick={closeModal}
        >
          <IconX size={18} stroke={1.5} />
        </button>
      </header>
      {/* Dragging is unreliable on small touch screens; these selects are
          the alternative. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75em',
          marginTop: '1em',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35em' }}>
          <span>Move to</span>
          <select
            className="kbn-input"
            style={{ width: 'auto' }}
            value={laneId}
            onChange={(e) => onMove(e.target.value)}
          >
            {lanes.map((lane) => (
              <option key={lane.id} value={lane.id}>
                {lane.title}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35em' }}>
          <span>Quadrant</span>
          <select
            className="kbn-input"
            style={{ width: 'auto' }}
            value={updatedQuadrant}
            onChange={(e) => setUpdatedQuadrant(e.target.value)}
          >
            <option value="">Unclassified</option>
            {QUADRANTS.map((q) => (
              <option key={q} value={q}>
                {quadrantNames[q]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        style={{
          marginTop: '1em',
          marginBottom: '1em',
          border: '1px dotted var(--sn-stylekit-secondary-border-color)',
          backgroundColor: 'var(--sn-stylekit-secondary-background-color)',
          color: 'var(--sn-stylekit-secondary-foreground-color)',
          padding: '1em',
        }}
      >
        <textarea
          className="card-description-input"
          placeholder="Description"
          value={updatedDescription}
          onChange={(e) => setUpdatedDescription(e.target.value)}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box' }}
        />
        <div
          style={{
            display: 'flex',
            gap: '0.75em',
            marginTop: '0.75em',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '0.35em' }}
          >
            <span>Due</span>
            <input
              type="date"
              className="kbn-input"
              style={{ width: 'auto' }}
              value={updatedDue}
              onChange={(e) => setUpdatedDue(e.target.value)}
            />
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35em',
              flex: 1,
              minWidth: '12em',
            }}
          >
            <span>Labels</span>
            <input
              className="kbn-input"
              style={{ flex: 1 }}
              placeholder="red, blue"
              value={updatedLabel}
              onChange={(e) => setUpdatedLabel(e.target.value)}
            />
          </label>
        </div>
      </div>
      <ChecklistSection
        checklist={updatedChecklist}
        onUpdate={setUpdatedChecklist}
      />
      <div>
        {updatedComments && updatedComments.length > 0 ? (
          updatedComments.map((comment, i) => (
            <CardComment
              key={`${i}-${comment}`}
              comment={comment}
              deleteComment={() => deleteCommentByIndex(i)}
            />
          ))
        ) : (
          <NoComments />
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5em', marginTop: '1em' }}>
        <input
          placeholder="New Comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addComment();
              e.preventDefault();
            }
          }}
          style={{ flex: 1 }}
        />
        <button onClick={addComment}>Add Comment</button>
      </div>
    </ReactModal>
  );
};
