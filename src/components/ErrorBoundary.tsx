import React, { useState } from 'react';

interface ErrorBoundaryProps {
  /** Last text received from Standard Notes, shown on request. */
  rawText: string;
  /** Saves edits made in the raw text, so a crash never locks the note. */
  onRawTextChange: (text: string) => void;
  /** Rendering is retried when this changes, e.g. when a new note arrives. */
  resetKey: unknown;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  showRaw: boolean;
}

interface RawTextProps {
  rawText: string;
  onRawTextChange: (text: string) => void;
}

/** The note as plain text, editable and still saved. */
const RawText = ({ rawText, onRawTextChange }: RawTextProps) => {
  const [text, setText] = useState(rawText);
  const [seenRawText, setSeenRawText] = useState(rawText);

  // A newer text from the app replaces what is shown, adjusted during render
  // instead of in an effect so the textarea never paints the stale text.
  if (rawText !== seenRawText) {
    setSeenRawText(rawText);
    setText(rawText);
  }

  return (
    <textarea
      className="kbn-input kbn-raw-text"
      aria-label="Raw note text"
      spellCheck={false}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onRawTextChange(event.target.value);
      }}
    />
  );
};

/**
 * Without this, any render error leaves a blank iframe, which looks the
 * same as a note that never loaded.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null, showRaw: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, showRaw: false });
    }
  }

  render() {
    const { error, showRaw } = this.state;
    if (!error) {
      return this.props.children;
    }
    const { rawText, onRawTextChange } = this.props;
    return (
      <div className="sn-component kbn-status kbn-error" role="alert">
        <p>The board could not be shown: {error.message}</p>
        {rawText && (
          <button
            type="button"
            className="kbn-btn kbn-btn-ghost"
            onClick={() => this.setState({ showRaw: !showRaw })}
          >
            {showRaw ? 'Hide raw text' : 'Show raw text'}
          </button>
        )}
        {showRaw && (
          <RawText rawText={rawText} onRawTextChange={onRawTextChange} />
        )}
      </div>
    );
  }
}
