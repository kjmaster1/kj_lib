// web/src/features/menu/list/index.tsx
import React from 'react';
import { useUiStore } from '../../../store/uiStore';
import { useMenuControls } from '../../../hooks/useMenuControls';
import { Box, Stack, Transition } from '@mantine/core';
import ListItem from './ListItem';
import Header from './Header';

const ListMenu: React.FC = () => {
  // 1. Get State from Store
  const { isMenuVisible, menuData } = useUiStore();

  // 2. Use Custom Hook for Logic
  // We default to 0 items if null to prevent hook errors
  const { selected } = useMenuControls(menuData?.items.length || 0, isMenuVisible);

  if (!menuData) return null;

  return (
    <Transition mounted={isMenuVisible} transition="slide-right" duration={200}>
      {(styles) => (
        <Box style={{ ...styles, position: 'absolute', left: 20, top: 20, width: 350 }}>
          <Header title={menuData.title} />

          <Box sx={(theme) => ({ backgroundColor: theme.colors.dark[8], borderRadius: '0 0 8px 8px' })}>
            <Stack spacing={4} p={8} style={{ maxHeight: '60vh', overflow: 'hidden' }}>
              {menuData.items.map((item, index) => (
                <ListItem
                  key={index}
                  item={item}
                  active={selected === index}
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
