//
import React, { useState } from 'react';
import { Box, Transition, createStyles } from '@mantine/core';
import { useUiStore, UiState } from '../../../store/uiStore';
import { fetchNui } from '../../../utils/fetchNui';
import RadialItem from './components/RadialItem';
import { useShallow } from 'zustand/react/shallow';
import { RadialMenuItem } from '../../../typings';

const useStyles = createStyles((theme) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 999,
  },
  centerPoint: {
    width: 6,
    height: 6,
    backgroundColor: theme.white,
    borderRadius: '50%',
    position: 'absolute',
    opacity: 0.5,
    pointerEvents: 'none', // Ensure center point doesn't block clicks
  },
}));

const RadialMenu: React.FC = () => {
  const { classes } = useStyles();

  // 1. Store Selection
  const { visible, items, menuId, closeRadial } = useUiStore(
    useShallow((state: UiState) => ({
      visible: state.radial.visible,
      items: state.radial.items,
      menuId: state.radial.id,
      closeRadial: state.radial.closeRadial,
    }))
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 2. Handle Action Logic
  const handleItemClick = (item: RadialMenuItem) => {
    // Send NUI event
    void fetchNui('radialClick', { itemId: item.id, menuId });

    // Close unless specified otherwise
    if (!item.keepOpen) {
      closeRadial();
      // Reset active index on close
      setActiveIndex(null);
    }
  };

  const handleBackgroundClick = () => {
    closeRadial();
    void fetchNui('radialClose');
    setActiveIndex(null);
  };

  if (!visible) return null;

  return (
    <Transition mounted={visible} transition="fade" duration={150}>
      {(styles) => (
        // Background Click closes the menu
        <Box className={classes.overlay} style={styles} onClick={handleBackgroundClick}>
          <div className={classes.centerPoint} />

          {items.map((item, index) => (
            <RadialItem
              key={item.id || index}
              item={item}
              index={index}
              total={items.length}
              radius={220} // Increased radius for better spacing
              isActive={activeIndex === index}
              // Highlight on hover
              onHover={() => setActiveIndex(index)}
              // Execute on click
              onClick={() => handleItemClick(item)}
            />
          ))}
        </Box>
      )}
    </Transition>
  );
};

export default RadialMenu;
