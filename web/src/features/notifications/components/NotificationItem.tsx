import React from 'react';
import { Toast } from 'react-hot-toast';
import { Box, Group, Stack, Text, ThemeIcon, RingProgress, Center, createStyles } from '@mantine/core';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import tinycolor from 'tinycolor2';
import { NotificationProps } from "../../../typings";
import LibIcon from "../../../components/LibIcon";
import MarkdownComponents from "../../../config/MarkdownComponents";

const rem = (px: number) => `${px / 16}rem`;

interface Props {
  t: Toast;
  data: NotificationProps;
}

const useStyles = createStyles((theme, { duration, visible }: { duration: number; visible: boolean }) => ({
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
    '& p': { margin: 0 },
  },
  // Fix TS2322: Move the RingProgress animation here using Mantine class logic
  ringTimer: {
    '& circle:last-of-type': {
      strokeDasharray: '100, 100',
      transition: `stroke-dashoffset ${duration}ms linear`,
      strokeDashoffset: visible ? 0 : 100,
    }
  }
}));

const getThemeColor = (type?: string, explicitColor?: string) => {
  if (explicitColor) return tinycolor(explicitColor).toRgbString();
  switch (type) {
    case 'error': return '#F03E3E';
    case 'success': return '#40C057';
    case 'warning': return '#FAB005';
    default: return '#228BE6';
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
  // Pass dynamic values to styles to handle animation
  const { classes } = useStyles({ duration: t.duration || 3000, visible: t.visible });

  const color = getThemeColor(data.type, data.iconColor);
  const icon = getIcon(data.type, data.icon);
  const showTimer = data.showDuration !== false;
  const isTop = t.position?.includes('top');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: isTop ? -50 : 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Box className={classes.container}>
        <Group noWrap spacing="sm" align="flex-start">
          <div style={{ position: 'relative' }}>
            {showTimer ? (
              <RingProgress
                size={36}
                thickness={3}
                roundCaps
                sections={[{ value: 100, color }]}
                // Fix TS2322: Use the class we generated instead of inline styles object
                classNames={{ root: classes.ringTimer }}
                styles={{ root: { transform: 'rotate(-90deg)' } }}
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
