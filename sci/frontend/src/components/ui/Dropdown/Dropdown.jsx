import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Dropdown.css';

export const Dropdown = ({
  trigger,
  items,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`dropdown-container ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15   }}
            className={`dropdown-menu ${
              align === 'right' ? 'dropdown-menu-right' : 'dropdown-menu-left'
            }`}
          >
            <div className="dropdown-menu-inner">
              {items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`dropdown-item ${
                    item.danger ? 'dropdown-item-danger' : 'dropdown-item-normal'
                  }`}
                >
                  {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
