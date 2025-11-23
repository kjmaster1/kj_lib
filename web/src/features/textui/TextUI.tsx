// web/src/features/textui/TextUI.tsx
import React from 'react';
import {Box, createStyles, Group, ThemeIcon} from '@mantine/core';
import {AnimatePresence, motion} from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {useUiStore} from '../../store/uiStore';
import {useShallow} from 'zustand/react/shallow';
import LibIcon from '../../components/LibIcon';
import MarkdownComponents from '../../config/MarkdownComponents';
import type {TextUiPosition} from '../../typings';

const rem = (px: number) => `${px / 16}rem`;

// 1. Layout Configuration Map
// Defines CSS position and Animation origin for each position type
const LAYOUT_CONFIG: Record<TextUiPosition, {
  style: React.CSSProperties;
  initial: object;
  animate: object;
  exit: object;
}> = {
  'right-center': {
    style: {top: '50%', right: 20, transform: 'translateY(-50%)'},
    initial: {x: 50, opacity: 0},
    animate: {x: 0, opacity: 1},
    exit: {x: 50, opacity: 0},
  },
  'left-center': {
    style: {top: '50%', left: 20, transform: 'translateY(-50%)'},
    initial: {x: -50, opacity: 0},
    animate: {x: 0, opacity: 1},
    exit: {x: -50, opacity: 0},
  },
  'top-center': {
    style: {top: 40, left: '50%', transform: 'translateX(-50%)'},
    initial: {y: -50, opacity: 0},
    animate: {y: 0, opacity: 1},
    exit: {y: -50, opacity: 0},
  },
  'bottom-center': {
    style: {bottom: 40, left: '50%', transform: 'translateX(-50%)'},
    initial: {y: 50, opacity: 0},
    animate: {y: 0, opacity: 1},
    exit: {y: 50, opacity: 0},
  },
};

const useStyles = createStyles((theme) => ({
  container: {
    position: 'absolute',
    backgroundColor: theme.colors.dark[6],
    padding: `${rem(12)} ${rem(16)}`,
    borderRadius: theme.radius.sm,
    boxShadow: theme.shadows.md,
    borderLeft: `4px solid ${theme.colors.blue[6]}`, // Accent bar
    maxWidth: rem(400),
    zIndex: 50, // Below modals (100+) but above game HUD
  },
  text: {
    color: theme.colors.gray[3],
    fontSize: rem(15),
    fontWeight: 500,
    lineHeight: 1.3,
    // Style markdown strong tags for keybinds (e.g. **E**)
    '& strong': {
      color: theme.white,
      backgroundColor: theme.colors.dark[4],
      padding: '2px 6px',
      borderRadius: 4,
      fontFamily: theme.fontFamilyMonospace,
      fontWeight: 700,
      fontSize: '0.9em',
      boxShadow: '0 2px 0 rgba(0,0,0,0.2)', // Pseudo-3D key look
    }
  }
}));

const TextUI: React.FC = () => {
  const {classes, theme} = useStyles();

  // 2. Select State
  const {visible, text, position, icon, iconColor} = useUiStore(
    useShallow((state: any) => ({ // Assuming 'textUi' slice exists
      visible: state.textUi.visible,
      text: state.textUi.text,
      position: state.textUi.position,
      icon: state.textUi.icon,
      iconColor: state.textUi.iconColor,
    }))
  );

  const layout = LAYOUT_CONFIG[position] || LAYOUT_CONFIG['right-center'];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          style={{position: 'absolute', ...layout.style}}
          initial={layout.initial}
          animate={layout.animate}
          exit={layout.exit}
          transition={{type: 'spring', stiffness: 300, damping: 25}}
        >
          <Box className={classes.container}>
            <Group noWrap spacing="sm">
              {icon && (
                <ThemeIcon
                  size="lg"
                  radius="md"
                  variant="light"
                  color={iconColor ? undefined : 'blue'}
                  sx={iconColor ? {color: iconColor, backgroundColor: 'rgba(255,255,255,0.1)'} : undefined}
                >
                  <LibIcon icon={icon} fixedWidth/>
                </ThemeIcon>
              )}

              <Box className={classes.text}>
                <ReactMarkdown components={MarkdownComponents}>
                  {text}
                </ReactMarkdown>
              </Box>
            </Group>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TextUI;
