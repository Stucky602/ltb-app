import React from 'react';
import { createRoot } from 'react-dom/client';
import LTBOrderTracker from './src/App.jsx';
import { ErrorBoundary } from './src/components/ErrorBoundary.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
// Wrapped at the mount point: a render throw anywhere inside used to unmount
// the whole tree and leave a blank screen with the business behind it.
root.render(
  React.createElement(ErrorBoundary, { label: 'app' },
    React.createElement(LTBOrderTracker)),
);
