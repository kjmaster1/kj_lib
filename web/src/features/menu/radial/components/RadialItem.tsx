//
import React from 'react';
import { Box, createStyles, Text } from '@mantine/core';
import LibIcon from '../../../../components/LibIcon';
import type { RadialMenuItem as IRadialItem } from '../../../../typings';
import { isIconUrl } from '../../../../utils/isIconUrl';

const rem = (px: number) => `${px / 16}rem`;

interface Props {
  item: IRadialItem;
  index: number;
  total: number;
  radius: number;
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
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
    width: rem(100),
    height: rem(100),
    cursor: 'pointer',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    opacity: params.active ? 1 : 0.85,
    zIndex: params.active ? 10 : 1,
    pointerEvents: 'all',
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
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
    overflow: 'hidden', // Ensure images stay within the circle
  },
  label: {
    marginTop: rem(8),
    fontSize: rem(13),
    fontWeight: 600,
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    color: theme.white,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: '2px 8px',
    borderRadius: theme.radius.sm,
    textAlign: 'center',
    lineHeight: 1.2,
  }
}));

const RadialItem: React.FC<Props> = ({ item, index, total, radius, isActive, onHover, onClick }) => {
  // Calculate position on the circle
  const angle = (index * 360) / total - 90;
  const radians = (angle * Math.PI) / 180;

  const x = Math.cos(radians) * radius;
  const y = Math.sin(radians) * radius;

  const { classes } = useStyles({ x, y, active: isActive });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <Box
      className={classes.wrapper}
      onClick={handleClick}
      onMouseEnter={onHover}
      sx={{ transform: isActive ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.15)` : undefined }}
    >
      <Box className={classes.iconBox}>
        {/* FIXED: Check if icon is a URL (image) or FontAwesome icon */}
        {typeof item.icon === 'string' && isIconUrl(item.icon) ? (
          <img
            src={item.icon}
            alt={item.label}
            style={{
              width: item.iconWidth ? rem(item.iconWidth) : '60%',
              height: item.iconHeight ? rem(item.iconHeight) : '60%',
              objectFit: 'contain'
            }}
          />
        ) : (
          <LibIcon
            icon={item.icon}
            fixedWidth
            size="lg"
            color={isActive ? 'white' : 'gray'}
          />
        )}
      </Box>
      <Text className={classes.label}>{item.label}</Text>
    </Box>
  );
};

export default React.memo(RadialItem);
