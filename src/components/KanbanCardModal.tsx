import React, { useState } from 'react';
import ReactModal from 'react-modal';
import {
  IconChevronDown,
  IconChevronRight,
  IconMessage,
  IconCircleX,
  IconX,
} from '@tabler/icons-react';
import {
  chipStyle,
  dueBadge,
  isoDate,
  labelChips,
  LabelColors,
} from '../lib/labels';
import { LABEL_PALETTE } from '../lib/labelColors';
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

/** Collapsible modal section: chevron, title and an optional count. */
const ModalSection = ({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="kbn-modal-section">
      <button
        type="button"
        className="kbn-modal-section-header"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <IconChevronDown size={14} stroke={1.5} />
        ) : (
          <IconChevronRight size={14} stroke={1.5} />
        )}
        <span className="kbn-modal-section-title">{title}</span>
        {count !== undefined && (
          <span className="kbn-modal-section-count">{count}</span>
        )}
      </button>
      {open && <div className="kbn-modal-section-body">{children}</div>}
    </div>
  );
};

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
    <ModalSection
      title="Checklist"
      count={`${done}/${checklist.length}`}
      defaultOpen={checklist.length > 0}
    >
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
    </ModalSection>
  );
};

/**
 * Chip editor for the comma separated label string: Enter or a comma
 * turns the draft into a chip, Backspace on an empty draft removes the
 * last one, and the dot on each chip opens its color swatches.
 */
const LabelInput = ({
  value,
  onChange,
  labelColors,
  onLabelColorsChange,
}: {
  value: string;
  onChange: (next: string) => void;
  labelColors?: LabelColors;
  onLabelColorsChange?: (colors: LabelColors) => void;
}) => {
  const [draft, setDraft] = useState('');
  const [colorTarget, setColorTarget] = useState<string | null>(null);
  const chips = labelChips(value, labelColors);

  const addDraft = () => {
    const names = draft
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length === 0) {
      return;
    }
    const known = chips.map((chip) => chip.name);
    onChange([...known, ...names.filter((n) => !known.includes(n))].join(', '));
    setDraft('');
  };

  const remove = (name: string) => {
    onChange(
      chips
        .filter((chip) => chip.name !== name)
        .map((chip) => chip.name)
        .join(', ')
    );
  };

  const assign = (name: string, color: string) => {
    onLabelColorsChange?.({ ...(labelColors ?? {}), [name]: color });
    setColorTarget(null);
  };

  const clear = (name: string) => {
    const next = { ...(labelColors ?? {}) };
    delete next[name];
    onLabelColorsChange?.(next);
    setColorTarget(null);
  };

  return (
    <div className="kbn-label-input">
      <div className="kbn-label-input-chips">
        {chips.map((chip) => (
          <span key={chip.name} className="kbn-label-chip-wrap">
            <span className="kbn-card-chip" style={chipStyle(chip.color)}>
              {chip.name}
            </span>
            {onLabelColorsChange && (
              <button
                type="button"
                className={`kbn-chip-dot${
                  chip.color ? ' kbn-chip-dot-set' : ''
                }`}
                style={chip.color ? { backgroundColor: chip.color } : undefined}
                aria-label={`Set color of ${chip.name}`}
                aria-expanded={colorTarget === chip.name}
                title="Label color"
                onClick={(e) => {
                  e.stopPropagation();
                  setColorTarget(colorTarget === chip.name ? null : chip.name);
                }}
              />
            )}
            <button
              type="button"
              className="kbn-chip-x"
              aria-label={`Remove label ${chip.name}`}
              onClick={(e) => {
                e.stopPropagation();
                remove(chip.name);
              }}
            >
              <IconX size={11} stroke={2} />
            </button>
          </span>
        ))}
        <input
          className="kbn-input kbn-label-input-field"
          placeholder="Add label"
          aria-label="Add label"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            // A comma commits what is typed, so pasting "a, b" works.
            if (e.target.value.includes(',')) {
              addDraft();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addDraft();
              e.preventDefault();
            }
            if (e.key === 'Backspace' && !draft && chips.length > 0) {
              remove(chips[chips.length - 1].name);
            }
          }}
        />
      </div>
      {colorTarget && (
        <div className="kbn-label-color-row">
          {LABEL_PALETTE.map(({ name, hex }) => (
            <button
              key={name}
              type="button"
              className="kbn-swatch"
              style={{ backgroundColor: hex }}
              aria-label={`Set ${colorTarget} to ${name}`}
              title={name}
              aria-pressed={labelColors?.[colorTarget] === name}
              onClick={() => assign(colorTarget, name)}
            />
          ))}
          <button
            type="button"
            className="kbn-swatch kbn-swatch-none"
            aria-label={`Clear ${colorTarget} color`}
            title="No color"
            aria-pressed={!labelColors?.[colorTarget]}
            onClick={() => clear(colorTarget)}
          />
        </div>
      )}
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
  labelColors?: LabelColors;
  onLabelColorsChange?: (colors: LabelColors) => void;
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
  labelColors,
  onLabelColorsChange,
  onMove,
}: KanbanCardModalProps) => {
  const { title, description, label, due, checklist, comments } = card;
  const [newComment, setNewComment] = useState('');
  const [updatedComments, setUpdatedComments] = useState(comments || []);
  const [updatedChecklist, setUpdatedChecklist] = useState(checklist || []);
  const [updatedTitle, setUpdatedTitle] = useState(title);
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
      // A card with no text would be unreadable on the board; an emptied
      // title keeps the previous one.
      title: updatedTitle.trim() || title,
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
        <input
          className="kbn-input"
          aria-label="Card title"
          value={updatedTitle}
          onChange={(e) => setUpdatedTitle(e.target.value)}
          style={{ fontWeight: 'bold', flex: 1, minWidth: '8em' }}
        />
        {due && (
          <span className={`kbn-due ${dueBadge(due)?.className}`}>
            {dueBadge(due)?.text}
          </span>
        )}
        {labelChips(label, labelColors).map((chip) => (
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
        <div className="kbn-field-row">
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
          <div
            className="kbn-due-shortcuts"
            role="group"
            aria-label="Due shortcuts"
          >
            {(
              [
                ['Today', 0],
                ['Tomorrow', 1],
                ['Next week', 7],
              ] as const
            ).map(([label, offset]) => (
              <button
                key={label}
                type="button"
                className="kbn-btn kbn-btn-ghost kbn-due-shortcut"
                aria-label={`Set due date to ${label.toLowerCase()}`}
                onClick={() => setUpdatedDue(isoDate(offset))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="kbn-field-row">
          <span>Labels</span>
          <LabelInput
            value={updatedLabel}
            onChange={setUpdatedLabel}
            labelColors={labelColors}
            onLabelColorsChange={onLabelColorsChange}
          />
        </div>
      </div>
      <ChecklistSection
        checklist={updatedChecklist}
        onUpdate={setUpdatedChecklist}
      />
      <ModalSection
        title="Comments"
        count={`${updatedComments.length}`}
        defaultOpen={updatedComments.length > 0}
      >
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
      </ModalSection>
    </ReactModal>
  );
};
