//
import React, { useEffect } from 'react';
import { Box, createStyles, Group, ThemeIcon, Text } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore, UiState } from '../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import LibIcon from '../../components/LibIcon';
import type { TextUiPosition } from '../../typings';

const rem = (px: number) => `${px / 16}rem`;

const LAYOUT_CONFIG: Record<TextUiPosition, {
  style: React.CSSProperties;
  initial: object;
  animate: object;
  exit: object;
}> = {
  'right-center': {
    style: { top: '50%', right: 20, transform: 'translateY(-50%)' },
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 50, opacity: 0 },
  },
  'left-center': {
    style: { top: '50%', left: 20, transform: 'translateY(-50%)' },
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  },
  'top-center': {
    style: { top: 40, left: '50%', transform: 'translateX(-50%)' },
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
  'bottom-center': {
    style: { bottom: 40, left: '50%', transform: 'translateX(-50%)' },
    initial: { y: 50, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 50, opacity: 0 },
  },
};

const useStyles = createStyles((theme) => ({
  container: {
    // FIXED: Removed 'position: absolute'. Let motion.div handle positioning.
    backgroundColor: theme.colors.dark[6],
    padding: `${rem(12)} ${rem(16)}`,
    borderRadius: theme.radius.sm,
    boxShadow: theme.shadows.md,
    borderLeft: `4px solid ${theme.colors.blue[6]}`,
    maxWidth: rem(400),
    minWidth: rem(150),
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
  },
  textContent: {
    color: theme.colors.gray[3],
    fontSize: rem(15),
    fontWeight: 500,
    lineHeight: 1.3,
    whiteSpace: 'pre-line',
    flex: 1,
  }
}));

const TextUI: React.FC = () => {
  const { classes } = useStyles();

  const { visible, text, position, icon, iconColor } = useUiStore(
    useShallow((state: UiState) => ({
      visible: state.textUi.visible,
      text: state.textUi.text,
      position: state.textUi.position,
      icon: state.textUi.icon,
      iconColor: state.textUi.iconColor,
    }))
  );

  const layout = LAYOUT_CONFIG[position] || LAYOUT_CONFIG['right-center'];

  useEffect(() => {
    if (visible) {
      console.log('[TextUI] Rendering:', { text, icon });
    }
  }, [visible, text, icon]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{ position: 'absolute', ...layout.style }}
          initial={layout.initial}
          animate={layout.animate}
          exit={layout.exit}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Box className={classes.container}>
            <Group noWrap spacing="sm" align="center" style={{ width: '100%' }}>
              {icon && (
                <ThemeIcon
                  size="lg"
                  radius="md"
                  variant="light"
                  color={iconColor ? undefined : 'blue'}
                  sx={iconColor ? { color: iconColor, backgroundColor: 'rgba(255,255,255,0.1)' } : undefined}
                >
                  <LibIcon icon={icon} fixedWidth />
                </ThemeIcon>
              )}

              <Text className={classes.textContent}>
                {text}
              </Text>
            </Group>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TextUI;
