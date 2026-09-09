import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '../Button/Button';
import './EmptyState.css';

export const EmptyState = ({
  title,
  description,
  icon = <Inbox style={{ height: '40px', width: '40px', color: 'var(--text-secondary)' }} />,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`empty-state ${className}`}>
      <div className="empty-state-icon-container">
        {icon}
      </div>
      <h3 className="empty-state-title">
        {title}
      </h3>
      <p className="empty-state-description">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
