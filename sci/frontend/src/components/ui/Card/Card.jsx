import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

export const Card = ({
  children,
  className = '',
  onClick,
  hoverGlow = true,
  elevated = false,
  outlined = false,
  interactive = false,
}) => {
  const isClickable = !!onClick;
  const shouldHover = hoverGlow && (isClickable || interactive);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        y: shouldHover ? -2 : 0,
        scale: shouldHover ? 1.005 : 1
      }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card card-padding ${
        isClickable ? 'card-clickable' : ''
      } ${elevated ? 'elevated' : ''} ${outlined ? 'outlined' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};