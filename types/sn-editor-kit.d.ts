declare module 'sn-editor-kit' {
  export interface EditorKitDelegateOptions {
    setEditorRawText?: (text: string) => void;
    clearUndoHistory?: () => void;
    getElementsBySelector?: () => string[];
  }

  export class EditorKitDelegate {
    constructor(options: EditorKitDelegateOptions);
  }

  export interface EditorKitOptions {
    delegate: EditorKitDelegate;
    mode: string;
    supportsFilesafe: boolean;
  }

  export class EditorKit {
    constructor(options: EditorKitOptions);
    onEditorValueChanged(text: string): void;
  }
}
