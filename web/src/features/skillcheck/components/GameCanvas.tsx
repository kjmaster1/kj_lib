// web/src/features/skillcheck/components/GameCanvas.tsx
import React from 'react';
import { createStyles } from '@mantine/core';

const rem = (px: number) => `${px / 16}rem`;

const useStyles = createStyles((theme) => ({
  svg: {
    width: '100%',
    height: '100%',
    maxWidth: rem(300), // Responsive max size
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
    stroke: theme.colors.blue[6],
    strokeWidth: 10,
    transition: 'stroke-dasharray 0.2s', // Smooth difficulty changes
  },
  indicator: {
    fill: 'none',
    stroke: theme.colors.red[7],
    strokeWidth: 14,
    strokeLinecap: 'butt',
    transformOrigin: 'center', // Crucial for rotation
  }
}));

interface Props {
  zoneStartAngle: number;
  zoneLengthAngle: number;
  indicatorRef: React.RefObject<SVGCircleElement>;
}

const GameCanvas: React.FC<Props> = ({ zoneStartAngle, zoneLengthAngle, indicatorRef }) => {
  const { classes } = useStyles();

  // SVG Math:
  // Center: 50,50. Radius: 40. Circumference: ~251.
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  // Calculate Dash Array for the Zone
  // DashArray: [LengthOfArc, LengthOfGap]
  const zoneLength = (zoneLengthAngle / 360) * circumference;
  const zoneGap = circumference - zoneLength;

  // Rotate the zone circle to the start position
  const zoneRotation = zoneStartAngle - 90; // -90 because SVG starts at 3 o'clock

  return (
    <svg viewBox="0 0 100 100" className={classes.svg}>
      {/* Static Grey Track */}
      <circle cx="50" cy="50" r={radius} className={classes.track} />

      {/* Target Zone */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        className={classes.zone}
        strokeDasharray={`${zoneLength} ${zoneGap}`}
        transform={`rotate(${zoneRotation} 50 50)`}
      />

      {/* Moving Indicator (Controlled by Ref/JS) */}
      <circle
        ref={indicatorRef}
        cx="50"
        cy="50"
        r={radius}
        className={classes.indicator}
        strokeDasharray={`${circumference * 0.02} ${circumference * 0.98}`} // Small blip
        // Initial transform
        transform="rotate(-90 50 50)"
      />
    </svg>
  );
};

export default React.memo(GameCanvas);
