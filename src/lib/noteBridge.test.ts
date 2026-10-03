import { NoteBridge, NoteBridgeDelegate, StreamedNote } from './noteBridge';

const fakeRelay = () => {
  let stream: ((note: StreamedNote) => void) | undefined;
  const relay = {
    environment: 'native-mobile-web',
    platform: 'android',
    streamContextItem: (callback: (note: StreamedNote) => void) => {
      stream = callback;
    },
    saveItemWithPresave: vi.fn((_note: StreamedNote, presave: () => void) =>
      presave()
    ),
  };
  return { relay, push: (note: StreamedNote) => stream!(note) };
};

const delegate = (): NoteBridgeDelegate & {
  texts: string[];
  clears: number;
} => {
  const d = {
    texts: [] as string[],
    clears: 0,
    setEditorRawText: (text: string) => d.texts.push(text),
    clearUndoHistory: () => {
      d.clears += 1;
    },
  };
  return d;
};

const note = (uuid: string, text: string, extra = {}): StreamedNote => ({
  uuid,
  content: { text },
  ...extra,
});

test('hands the streamed note text to the editor', () => {
  const { relay, push } = fakeRelay();
  const d = delegate();
  new NoteBridge(d, relay);

  push(note('n1', '# Lane'));

  expect(d.texts).toEqual(['# Lane']);
});

test('clears the undo history only when a different note arrives', () => {
  const { relay, push } = fakeRelay();
  const d = delegate();
  new NoteBridge(d, relay);

  push(note('n1', 'a'));
  push(note('n1', 'b'));
  push(note('n2', 'c'));

  expect(d.texts).toEqual(['a', 'b', 'c']);
  expect(d.clears).toBe(2);
});

test('ignores metadata-only updates', () => {
  const { relay, push } = fakeRelay();
  const d = delegate();
  new NoteBridge(d, relay);

  push(note('n1', 'a'));
  push(note('n1', 'a', { isMetadataUpdate: true }));

  expect(d.texts).toEqual(['a']);
});

test('treats a note without text as empty', () => {
  const { relay, push } = fakeRelay();
  const d = delegate();
  new NoteBridge(d, relay);

  push({ uuid: 'n1', content: {} });

  expect(d.texts).toEqual(['']);
});

test('does not save before a note has arrived', () => {
  const { relay } = fakeRelay();
  const bridge = new NoteBridge(delegate(), relay);

  bridge.onEditorValueChanged('# Lane');

  expect(relay.saveItemWithPresave).not.toHaveBeenCalled();
});

test('saves the text and its plain preview into the current note', () => {
  const { relay, push } = fakeRelay();
  const bridge = new NoteBridge(delegate(), relay);
  const current = note('n1', 'old');
  push(current);

  bridge.onEditorValueChanged('# New');

  expect(relay.saveItemWithPresave).toHaveBeenCalledWith(
    current,
    expect.any(Function)
  );
  expect(current.content).toEqual({
    text: '# New',
    preview_plain: '# New',
    preview_html: undefined,
  });
});

test('reports what the relay was told at registration', () => {
  const { relay } = fakeRelay();
  const bridge = new NoteBridge(delegate(), relay);

  expect(bridge.environment).toBe('native-mobile-web');
  expect(bridge.platform).toBe('android');
});

test('asks for the note even when the host origin is "null"', () => {
  // The native mobile app hosts the plugin from an opaque origin. Posting
  // back with targetOrigin "null" throws, so the note was never requested.
  const posted = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  try {
    new NoteBridge(delegate());
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'null',
        data: JSON.stringify({
          action: 'component-registered',
          sessionKey: 'key',
          componentData: {},
          data: {
            uuid: 'c1',
            environment: 'native-mobile-web',
            platform: 'android',
          },
        }),
      })
    );

    expect(posted).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'stream-context-item' }),
      '*'
    );
  } finally {
    posted.mockRestore();
  }
});
