
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PublicApplyView from './components/PublicApplyView';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Robust check for Public Mode
// We check both the pathname '/apply' (for production) AND the query param '?mode=public' (for testing/preview)
const path = window.location.pathname;
const searchParams = new URLSearchParams(window.location.search);
const isPublicMode = path === '/apply' || searchParams.get('mode') === 'public';

if (isPublicMode) {
  // Render standalone Public Page (No Auth required)
  root.render(
    <React.StrictMode>
      <PublicApplyView />
    </React.StrictMode>
  );
} else {
  // Render Main Admin App
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
