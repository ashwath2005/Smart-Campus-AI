import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/providers/AppProviders';
import App from './app/App';
import './index.css';
import { register as registerServiceWorker } from './service-worker-registration';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

// Register service worker for PWA support
registerServiceWorker();
