import ComponentRelay from '@standardnotes/component-relay';

/**
 * Plain-text note bridge to Standard Notes, doing what
 * @standardnotes/editor-kit did for this editor. The kit bundles a 2022
 * copy of the component relay that posts to the host with targetOrigin
 * "null" on the native mobile app, which throws, so the note was never
 * requested. Relay 2.3.2 falls back to "*".
 */

export interface StreamedNote {
  uuid: string;
  isMetadataUpdate?: boolean;
  content: {
    text?: string;
    preview_plain?: string;
    preview_html?: string;
  };
}

export interface NoteBridgeDelegate {
  setEditorRawText(text: string): void;
  clearUndoHistory(): void;
}

// The part of ComponentRelay used here; tests pass a fake.
interface Relay {
  streamContextItem(callback: (note: StreamedNote) => void): void;
  saveItemWithPresave(note: StreamedNote, presave: () => void): void;
  readonly environment?: string;
  readonly platform?: string;
}

const createRelay = (): Relay => {
  const relay: ComponentRelay = new ComponentRelay({
    targetWindow: window,
    options: { coallesedSaving: true, coallesedSavingDelay: 350 },
    onReady: () => {
      if (relay.platform) {
        document.documentElement.classList.add(relay.platform);
      }
    },
    handleRequestForContentHeight: () => undefined,
  });
  return (relay as unknown) as Relay;
};

export class NoteBridge {
  private note?: StreamedNote;

  constructor(
    private delegate: NoteBridgeDelegate,
    private relay: Relay = createRelay()
  ) {
    relay.streamContextItem((note) => {
      const isNewNote = this.note?.uuid !== note.uuid;
      this.note = note;
      if (note.isMetadataUpdate) {
        return;
      }
      this.delegate.setEditorRawText(note.content?.text || '');
      if (isNewNote) {
        this.delegate.clearUndoHistory();
      }
    });
  }

  get environment(): string | undefined {
    return this.relay.environment;
  }

  get platform(): string | undefined {
    return this.relay.platform;
  }

  onEditorValueChanged(text: string): void {
    const note = this.note;
    if (!note) {
      return;
    }
    this.relay.saveItemWithPresave(note, () => {
      note.content.text = text;
      note.content.preview_plain = text;
      note.content.preview_html = undefined;
    });
  }
}
