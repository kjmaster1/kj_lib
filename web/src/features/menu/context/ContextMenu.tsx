import React, { useEffect, useRef } from 'react';
import { Box, createStyles, Stack, Transition, Text, Group } from '@mantine/core';
import { useUiStore } from '../../../store/uiStore';
import { fetchNui } from '../../../utils/fetchNui';
import LibIcon from '../../../components/LibIcon';
import { useShallow } from 'zustand/react/shallow';
import ContextButton from './components/ContextButton';

const useStyles = createStyles((theme) => ({
  menuContainer: {
    position: 'absolute',
    width: 280,
    backgroundColor: theme.colors.dark[7],
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.dark[4]}`,
    boxShadow: theme.shadows.xl,
    zIndex: 1000,
    overflow: 'hidden',
    padding: 4,
  },
  header: {
    padding: '8px 12px',
    backgroundColor: theme.colors.dark[8],
    borderBottom: `1px solid ${theme.colors.dark[5]}`,
    marginBottom: 4,
    borderRadius: theme.radius.sm,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: theme.colors.gray[3],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
}));

const ContextMenu: React.FC = () => {
  const { classes } = useStyles();
  const ref = useRef<HTMLDivElement>(null);

  // 1. Store
  const { visible, menu } = useUiStore(useShallow(state => state.context));

  // 2. Auto-close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (visible && ref.current && !ref.current.contains(e.target as Node)) {
        void fetchNui('closeContext');
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [visible]);

  if (!menu) return null;

  return (
    <Transition mounted={visible} transition="pop-top-left" duration={150}>
      {(styles) => (
        <Box
          ref={ref}
          className={classes.menuContainer}
          style={{ ...styles, top: '20%', left: '50%' }} // Position should come from Mouse Events in real app
        >
          {/* Header Section */}
          <Box className={classes.header}>
            <Group position="apart">
              <Text className={classes.headerTitle}>{menu.title}</Text>
              {menu.menu && (
                <LibIcon
                  icon="arrow-left"
                  cursor="pointer"
                  onClick={() => fetchNui('openContext', { id: menu.menu })} // Back navigation
                />
              )}
            </Group>
          </Box>

          {/* Items Section */}
          <Stack spacing={2}>
            {/* Normalize options to array whether it is Record or Array */}
            {Object.values(menu.options || {}).map((item, index) => (
              <ContextButton
                key={index}
                item={item}
                onClick={() => fetchNui('clickContext', index)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Transition>
  );
};

export default ContextMenu;
