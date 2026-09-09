import React from 'react';
import { motion } from 'framer-motion';
import './Tabs.css';

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`segmented-control-bg tabs-container ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tabs-btn ${
              isActive ? 'tabs-btn-active' : 'tabs-btn-inactive'
            }`}
          >
            <span className="tabs-label-text">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="tabs-active-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 32  }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
