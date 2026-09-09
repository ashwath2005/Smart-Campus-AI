import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import './SmoothScroll.css';

export const SmoothScroll = ({ children }) => {
  const scrollRef = useRef(null);
  const [pageHeight, setPageHeight] = useState(0);

  // Resize observer to update mock body height dynamically when content changes
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        setPageHeight(scrollRef.current.scrollHeight);
      }
    };

    // Run initial height check
    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (scrollRef.current) {
      resizeObserver.observe(scrollRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [children]);

  // Hook into native scroll positions
  const { scrollY } = useScroll();

  // Configure smooth spring physics for the momentum scroll feel
  const transformY = useTransform(scrollY, (y) => -y);
  const springY = useSpring(transformY, {
    damping: 18,     // Smooth deceleration
    stiffness: 90,   // Snappiness of scroll tracking
    mass: 0.8,       // Acceleration inertia
    restDelta: 0.01  // Precision threshold
  });

  return (
    <>
      {/* Ghost scroll spacer to extend the document length so the browser scrolls naturally */}
      <div 
        style={{ height: pageHeight }} 
        className="smooth-scroll-spacer" 
      />
      
      {/* Fixed layer containing all children translated via spring physics */}
      <motion.div
        ref={scrollRef}
        style={{ y: springY }}
        className="smooth-scroll-container"
      >
        {children}
      </motion.div>
    </>
  );
};
