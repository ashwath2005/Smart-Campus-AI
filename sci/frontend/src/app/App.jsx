import React from 'react';
import { Toaster } from 'react-hot-toast';
import { OfflineIndicator } from '../components/OfflineIndicator/OfflineIndicator';
import { AppRoutes } from './routes';

/**
 * Root Application Component
 */
export function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <OfflineIndicator />
      <AppRoutes />
    </>
  );
}

export default App;
