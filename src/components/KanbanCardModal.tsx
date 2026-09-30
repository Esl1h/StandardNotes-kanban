import React, { useState } from 'react';
import ReactModal from 'react-modal';
import { IconMessage, IconCircleX } from '@tabler/icons-react';

const CardComment = ({ comment, deleteComment }) => (
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

export const KanbanCardModal = ({ card, hideModal, updateCard }) => {
  const { title, description, label, comments } = card;
  const [newComment, setNewComment] = useState('');
  const [updatedComments, setUpdatedComments] = useState(comments || []);
  const [updatedDescription, setUpdatedDescription] = useState(description || '');
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
    updateCard({ description: updatedDescription, comments: updatedComments });
    hideModal();
  };

  return (
    <ReactModal
      isOpen
      onRequestClose={closeModal}
      style={customStyles}
      appElement={document.getElementById('sn-component') ?? undefined}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
        <span style={{ fontWeight: 'bold', lineHeight: '18px' }}>{title}</span>
        {label && <span className="card-label-chip">{label}</span>}
      </header>
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
      </div>
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
