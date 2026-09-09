import React, { useState, useEffect } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { Navbar } from '../Navbar/Navbar';
import { CommandPalette } from '../CommandPalette/CommandPalette';
import { AICopilotWidget } from '../AICopilot/AICopilotWidget';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './Layout.css';

export const Layout = ({ children }) => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const location = useLocation();

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    return (
      <div className="layout-unauth-container">
        {children}
      </div>
    );
  }

  return (
    <div className="layout-auth-container">
      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
      />

      {/* Master Application Shell Container */}
      <div className="layout-app-shell">
        {/* Sidebar - Reference Left Navigation */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="layout-content-wrapper">
          <div className="layout-inner-frame">
            <Navbar
              isSidebarOpen={isSidebarOpen}
              onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
            />
            <main className="layout-main custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="layout-main-transition-container"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Floating AI Copilot Widget */}
      <AICopilotWidget />
    </div>
  );
};

