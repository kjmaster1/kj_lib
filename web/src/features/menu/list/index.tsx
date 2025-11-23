//
import React from 'react';
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

  // FIXED: Pass the full items array to the updated hook
  const { selected, scrollIndex } = useMenuControls(data?.items || [], visible);

  if (!data) return null;

  return (
    <Transition mounted={visible} transition="slide-right" duration={200}>
      {(styles) => (
        <Box style={{ ...styles, position: 'absolute', left: 20, top: 20, width: 350 }}>
          <Header title={data.title} />

          <Box sx={(theme) => ({ backgroundColor: theme.colors.dark[8], borderRadius: '0 0 8px 8px' })}>
            <Stack spacing={4} p={8} style={{ maxHeight: '60vh', overflow: 'hidden' }}>
              {data.items.map((item, index) => (
                <ListItem
                  key={index}
                  item={item}
                  active={selected === index}
                  // Pass scrollIndex ONLY to the active item
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
