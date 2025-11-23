// web/src/features/notifications/components/NotificationItem.tsx
import React from 'react';
import { Toast } from 'react-hot-toast';
import { Box, Group, Stack, Text, ThemeIcon, RingProgress, Center, createStyles } from '@mantine/core';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import tinycolor from 'tinycolor2';
import {NotificationProps} from "../../../typings";
import LibIcon from "../../../components/LibIcon";
import MarkdownComponents from "../../../config/MarkdownComponents";

const rem = (px: number) => `${px / 16}rem`;

interface Props {
  t: Toast;
  data: NotificationProps;
}

const useStyles = createStyles((theme) => ({
  container: {
    width: rem(300),
    backgroundColor: theme.colors.dark[6],
    color: theme.colors.dark[0],
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.dark[4]}`,
  },
  title: {
    fontWeight: 600,
    fontSize: rem(15),
    color: theme.colors.gray[3],
    lineHeight: 1.2,
  },
  description: {
    fontSize: rem(13),
    color: theme.colors.dark[1],
    lineHeight: 1.4,
    '& p': { margin: 0 }, // Reset markdown paragraph margins
  },
}));

// Resolve semantic types to colors
const getThemeColor = (type?: string, explicitColor?: string) => {
  if (explicitColor) return tinycolor(explicitColor).toRgbString();

  switch (type) {
    case 'error': return '#F03E3E'; // red.7
    case 'success': return '#40C057'; // teal.6
    case 'warning': return '#FAB005'; // yellow.6
    default: return '#228BE6'; // blue.6
  }
};

const getIcon = (type?: string, explicitIcon?: any) => {
  if (explicitIcon) return explicitIcon;
  switch (type) {
    case 'error': return 'circle-xmark';
    case 'success': return 'circle-check';
    case 'warning': return 'circle-exclamation';
    default: return 'circle-info';
  }
};

const NotificationItem: React.FC<Props> = ({ t, data }) => {
  const { classes } = useStyles();
  const color = getThemeColor(data.type, data.iconColor);
  const icon = getIcon(data.type, data.icon);
  const showTimer = data.showDuration !== false;

  // Animation variants based on toast position
  const isTop = t.position?.includes('top');
  const initialY = isTop ? -50 : 50;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: initialY, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Box className={classes.container}>
        <Group noWrap spacing="sm" align="flex-start">

          {/* Icon Section */}
          <div style={{ position: 'relative' }}>
            {showTimer ? (
              <RingProgress
                size={36}
                thickness={3}
                roundCaps
                sections={[{ value: 100, color }]}
                styles={{
                  root: { transform: 'rotate(-90deg)' },
                  // Simple CSS animation for the timer ring
                  'svg > circle:last-of-type': {
                    strokeDasharray: '100, 100',
                    transition: `stroke-dashoffset ${t.duration}ms linear`,
                    strokeDashoffset: t.visible ? 0 : 100, // Animate from empty to full or vice versa
                  }
                }}
                label={
                  <Center style={{ transform: 'rotate(90deg)' }}>
                    <LibIcon icon={icon} fixedWidth color={color} size="sm" animation={data.iconAnimation} />
                  </Center>
                }
              />
            ) : (
              <ThemeIcon radius="xl" size={36} color={color} variant="light">
                <LibIcon icon={icon} fixedWidth animation={data.iconAnimation} />
              </ThemeIcon>
            )}
          </div>

          {/* Content Section */}
          <Stack spacing={4} sx={{ flex: 1 }}>
            {data.title && <Text className={classes.title}>{data.title}</Text>}
            {data.description && (
              <Box className={classes.description}>
                <ReactMarkdown components={MarkdownComponents}>
                  {data.description}
                </ReactMarkdown>
              </Box>
            )}
          </Stack>

        </Group>
      </Box>
    </motion.div>
  );
};

export default NotificationItem;
