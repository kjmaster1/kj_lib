import React, { forwardRef } from 'react';
import { AnimatePresence, motion, HTMLMotionProps } from 'framer-motion';

// Extend standard Motion props so we can pass className, style, onClick, etc.
interface ScaleFadeProps extends HTMLMotionProps<'div'> {
  visible: boolean;
  initialScale?: number;
  duration?: number;
  onExitComplete?: () => void;
}

const ScaleFade = forwardRef<HTMLDivElement, ScaleFadeProps>(
  (
    {
      visible,
      children,
      initialScale = 0.95,
      duration = 0.2,
      onExitComplete,
      style,
      ...rest // Capture remaining props (className, id, aria-*, etc.)
    },
    ref
  ) => {
    return (
      <AnimatePresence onExitComplete={onExitComplete}>
        {visible && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: initialScale }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: {
                duration,
                ease: [0.25, 0.8, 0.25, 1] // 'easeOutQuart' for smoother entry
              }
            }}
            exit={{
              opacity: 0,
              scale: initialScale,
              transition: {
                duration: duration * 0.75, // Exit is usually faster than enter
                ease: [0.4, 0, 1, 1] // 'easeInCubic' for snappy exit
              }
            }}
            style={{
              // Ensure it doesn't collapse layout if children are absolute
              willChange: 'opacity, transform',
              ...style
            }}
            {...rest}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ScaleFade.displayName = 'ScaleFade';

export default ScaleFade;
