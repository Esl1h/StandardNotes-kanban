import React from 'react';
import ReactDOM from 'react-dom/client';
// sn-editor-kit ships a pre-transpiled bundle that references the
// regeneratorRuntime global; load the polyfill before anything else.
import 'regenerator-runtime/runtime';
import './index.scss';
import Editor from './components/Editor';
import './stylesheets/main.scss';

const rootElement = document.getElementById('root') as HTMLElement;
ReactDOM.createRoot(rootElement).render(
  <React.Fragment>
    <Editor />
  </React.Fragment>
);
