// web/src/features/progress/ProgressContainer.tsx
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import LinearProgress from './components/LinearProgress';
import CircularProgress from './components/CircularProgress';

const ProgressContainer: React.FC = () => {
  const { visible, type, label, duration, position, showPercentage, closeProgress } = useUiStore(
    useShallow((state: any) => ({ // Assuming 'progress' slice exists in store
      visible: state.progress.visible,
      type: state.progress.type,
      label: state.progress.label,
      duration: state.progress.duration,
      position: state.progress.position,
      showPercentage: state.progress.showPercentage,
      closeProgress: state.closeProgress,
    }))
  );

  // Layout Styles
  const positionStyles: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: position === 'middle' ? '50%' : '10%',
    // If middle, we offset Y to center strictly
    ...(position === 'middle' ? { top: '50%', bottom: 'auto', transform: 'translate(-50%, -50%)' } : {}),
    zIndex: 500,
  };

  return (
    <div style={positionStyles}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {type === 'linear' ? (
              <LinearProgress
                duration={duration}
                label={label}
                onComplete={closeProgress}
              />
            ) : (
              <CircularProgress
                duration={duration}
                label={label}
                showPercentage={showPercentage}
                onComplete={closeProgress}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProgressContainer;
