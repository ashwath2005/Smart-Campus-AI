import React, { useState, useEffect, useRef } from 'react';
import './Toast.css';

export const Toast = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'default',
  duration = 5000,
  position = 'top-right',
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      timerRef.current = setTimeout(() => {
        onClose();
      }, duration);
    } else {
      setVisible(false);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, onClose, duration]);

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className={`toast-container toast-${position} ${variant} ${isOpen ? 'toast-visible' : ''} ${props.className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast-content">
        {title && <h3 className="toast-title">{title}</h3>}
        {description && <p className="toast-description">{description}</p>}
        <button
          className="toast-close-btn"
          onClick={handleClose}
          aria-label="Close toast"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
};

Toast.displayName = 'Toast';