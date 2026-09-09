import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

export const Card = ({
  children,
  className = '',
  onClick,
  hoverGlow = true,
}) => {
  const isClickable = !!onClick;
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={isClickable || hoverGlow ? { y: -3 } : {}}
      transition={{ type: 'spring', stiffness: 380, damping: 28  }}
      className={`glass-card card-padding ${
        isClickable ? 'card-clickable' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
};
