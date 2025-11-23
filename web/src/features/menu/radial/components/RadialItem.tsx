import React from 'react';
import { Box, createStyles, Text } from '@mantine/core';
import LibIcon from '../../../../components/LibIcon';
import type { RadialMenuItem as IRadialItem } from '../../../../typings/radial';


const rem = (px: number) => `${px / 16}rem`;

interface Props {
  item: IRadialItem;
  index: number;
  total: number;
  radius: number;
  isActive: boolean;
  onSelect: () => void;
}

const useStyles = createStyles((theme, params: { x: number; y: number; active: boolean }) => ({
  wrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${params.x}px), calc(-50% + ${params.y}px))`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: rem(90), // Fixed click target size
    height: rem(90),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    opacity: params.active ? 1 : 0.8,
    scale: params.active ? '1.1' : '1',
    zIndex: params.active ? 10 : 1,
  },
  iconBox: {
    width: rem(50),
    height: rem(50),
    borderRadius: '50%',
    backgroundColor: params.active ? theme.colors.blue[6] : theme.colors.dark[6],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.shadows.md,
    border: `2px solid ${params.active ? theme.white : theme.colors.dark[4]}`,
  },
  label: {
    marginTop: rem(4),
    fontSize: rem(12),
    fontWeight: 600,
    textShadow: '0 0 4px rgba(0,0,0,0.8)',
    color: theme.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '2px 6px',
    borderRadius: theme.radius.sm,
    pointerEvents: 'none', // Allow clicking through label to button
  }
}));

const RadialItem: React.FC<Props> = ({ item, index, total, radius, isActive, onSelect }) => {
  // Math extracted to render phase, but could be memoized if expensive
  const angle = (index * 360) / total - 90; // -90 to start at top
  const radians = (angle * Math.PI) / 180;
  const x = Math.cos(radians) * radius;
  const y = Math.sin(radians) * radius;

  const { classes } = useStyles({ x, y, active: isActive });

  return (
    <Box className={classes.wrapper} onClick={onSelect} onMouseEnter={onSelect}>
      <Box className={classes.iconBox}>
        <LibIcon icon={item.icon} fixedWidth size="lg" color={isActive ? 'white' : 'gray'} />
      </Box>
      <Text className={classes.label}>{item.label}</Text>
    </Box>
  );
};

export default React.memo(RadialItem);
