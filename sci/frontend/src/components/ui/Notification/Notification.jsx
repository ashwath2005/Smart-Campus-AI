import React from 'react';
import './Notification.css';

export const Notification = ({
  title,
  description,
  variant = 'default',
  icon,
  actions = [],
  className = '',
  ...props
}) => {
  return (
    <div className={`notification notification-${variant} ${className}`} {...props}>
      <div className="notification-content">
        {icon && <div className="notification-icon">{icon}</div>}
        <div className="notification-body">
          {title && <h3 className="notification-title">{title}</h3>}
          {description && <p className="notification-description">{description}</p>}
        </div>
        {actions.length > 0 && (
          <div className="notification-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`notification-action-btn ${action.variant || ''}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Notification.displayName = 'Notification';