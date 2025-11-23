import React, { useEffect, useState } from 'react';
import { Box, Transition, createStyles } from '@mantine/core';
import { useUiStore } from '../../../store/uiStore';
import { fetchNui } from '../../../utils/fetchNui';
import RadialItem from './components/RadialItem';
import { useShallow } from 'zustand/react/shallow';

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
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dim background
    zIndex: 999,
  },
  centerPoint: {
    width: 6,
    height: 6,
    backgroundColor: theme.white,
    borderRadius: '50%',
    position: 'absolute',
    opacity: 0.5,
  },
}));

const RadialMenu: React.FC = () => {
  const { classes } = useStyles();

  // 1. Store Selection
  const { visible, items, menuId, closeRadial } = useUiStore(useShallow(state => ({
    visible: state.radial.visible,
    items: state.radial.items,
    menuId: state.radial.id,
    closeRadial: state.closeRadial // Assuming this action exists in store
  })));

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 2. Handle Selection Logic
  const handleSelect = (index: number) => {
    setActiveIndex(index);
  };

  const confirmSelection = () => {
    if (activeIndex !== null && items[activeIndex]) {
      const item = items[activeIndex];
      fetchNui('radialClick', { itemId: item.id, menuId });

      // Optimistic close if we assume action will close it
      if (!item.keepOpen) closeRadial();
    } else {
      closeRadial(); // Clicked center/nothing
      fetchNui('radialClose');
    }
    setActiveIndex(null);
  };

  // 3. Mouse/Keyboard Interaction
  // (Simplified for brevity: In production, add MouseMove angle calculation here
  // to select items by just moving mouse towards them)

  if (!visible) return null;

  return (
    <Transition mounted={visible} transition="fade" duration={150}>
      {(styles) => (
        <Box className={classes.overlay} style={styles} onClick={confirmSelection}>
          <div className={classes.centerPoint} />

          {items.map((item, index) => (
            <RadialItem
              key={item.id || index}
              item={item}
              index={index}
              total={items.length}
              radius={180} // Configurable radius
              isActive={activeIndex === index}
              onSelect={(e) => {
                e.stopPropagation(); // Prevent immediate close
                handleSelect(index);
              }}
            />
          ))}
        </Box>
      )}
    </Transition>
  );
};

export default RadialMenu;
