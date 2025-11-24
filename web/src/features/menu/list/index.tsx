import React, { useMemo } from 'react';
import { useUiStore, UiState } from '../../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { useMenuControls } from '../../../hooks/useMenuControls';
import { Box, Stack, Transition } from '@mantine/core';
import ListItem from './ListItem';
import Header from './Header';

const ListMenu: React.FC = () => {
  const { visible, data } = useUiStore(
    useShallow((state: UiState) => ({
      visible: state.menu.visible,
      data: state.menu.data,
    }))
  );

  const { selected, scrollIndex } = useMenuControls(data?.items || [], visible);

  // FIXED: Calculate position based on the prop passed from Client
  const positionStyle = useMemo(() => {
    const pos = data?.position || 'top-left';
    switch (pos) {
      case 'top-right':
        return { top: 20, right: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'bottom-right':
        return { bottom: 20, right: 20 };
      case 'top-left':
      default:
        return { top: 20, left: 20 };
    }
  }, [data?.position]);

  if (!data) return null;

  const safeItems = data.items || [];

  return (
    <Transition mounted={visible} transition="slide-right" duration={200}>
      {(styles) => (
        <Box
          style={{
            ...styles, // Animation styles from Mantine
            ...positionStyle,
            position: 'absolute',
            width: 350
          }}
        >
          <Header title={data.title} />

          <Box sx={(theme) => ({ backgroundColor: theme.colors.dark[8], borderRadius: '0 0 8px 8px' })}>
            <Stack spacing={4} p={8} style={{ maxHeight: '60vh', overflow: 'hidden' }}>
              {safeItems.map((item, index) => (
                <ListItem
                  key={index}
                  item={item}
                  active={selected === index}
                  scrollIndex={selected === index ? scrollIndex : (item.defaultIndex || 0)}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      )}
    </Transition>
  );
};

export default ListMenu;
