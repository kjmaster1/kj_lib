//
import React from 'react';
import { createStyles } from '@mantine/core';

const rem = (px: number) => `${px / 16}rem`;

const useStyles = createStyles((theme, { isSuccess }: { isSuccess: boolean }) => ({
  svg: {
    width: '100%',
    height: '100%',
    maxWidth: rem(300),
    maxHeight: rem(300),
    filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.5))',
  },
  track: {
    fill: 'none',
    stroke: theme.colors.dark[6],
    strokeWidth: 10,
  },
  zone: {
    fill: 'none',
    // Flash Green on success, otherwise Blue
    stroke: isSuccess ? theme.colors.green[6] : theme.colors.blue[6],
    strokeWidth: 10,
    transition: 'stroke 0.1s ease', // Fast transition for the flash
  },
  indicator: {
    fill: 'none',
    stroke: theme.colors.red[7],
    strokeWidth: 14,
    strokeLinecap: 'butt',
    transformOrigin: 'center',
  }
}));

interface Props {
  zoneStartAngle: number;
  zoneLengthAngle: number;
  indicatorRef: React.RefObject<SVGCircleElement>;
  isSuccess?: boolean;
}

const GameCanvas: React.FC<Props> = ({ zoneStartAngle, zoneLengthAngle, indicatorRef, isSuccess = false }) => {
  const { classes } = useStyles({ isSuccess });

  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const zoneLength = (zoneLengthAngle / 360) * circumference;
  const zoneGap = circumference - zoneLength;
  // Visual adjustment: -90 to start at 12 o'clock
  const zoneRotation = zoneStartAngle - 90;

  return (
    <svg viewBox="0 0 100 100" className={classes.svg}>
      <circle cx="50" cy="50" r={radius} className={classes.track} />

      <circle
        cx="50"
        cy="50"
        r={radius}
        className={classes.zone}
        strokeDasharray={`${zoneLength} ${zoneGap}`}
        transform={`rotate(${zoneRotation} 50 50)`}
      />

      <circle
        ref={indicatorRef}
        cx="50"
        cy="50"
        r={radius}
        className={classes.indicator}
        strokeDasharray={`${circumference * 0.02} ${circumference * 0.98}`}
        transform="rotate(-90 50 50)" // Initial Position
      />
    </svg>
  );
};

export default React.memo(GameCanvas);
