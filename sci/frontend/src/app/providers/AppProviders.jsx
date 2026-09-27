import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ErrorBoundary/ErrorBoundary';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { NotificationProvider } from '../../context/NotificationContext';

/**
 * Consolidated Application Providers Tree
 */
export function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
