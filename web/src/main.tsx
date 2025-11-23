import React from 'react';
import ReactDOM from 'react-dom/client';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import App from './App';
import ErrorBoundary from './providers/errorBoundary';
import { isEnvBrowser } from './utils/misc';
import './index.css';

// 1. Icon Library Configuration
// We load all icons to support dynamic usage from Lua scripts.
// In a stricter app, we would only import used icons to save bundle size.
library.add(fas, far, fab);

// 2. Development Environment Setup
if (isEnvBrowser()) {
  const root = document.getElementById('root');
  if (root) {
    // Apply a background to simulate the game environment in browser
    Object.assign(root.style, {
      backgroundImage: 'url("https://i.imgur.com/3pzRj9n.png")',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    });
  }
}

// 3. Application Mounting
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Check index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* ErrorBoundary remains at the top to catch crashes in App composition */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
