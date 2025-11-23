// web/src/features/progress/components/CircularProgress.tsx
import React, { useEffect } from 'react';
import {Box, Text, createStyles} from "@mantine/core";
import {motion, animate, useMotionValue, useTransform} from "framer-motion";
import {fetchNui} from "../../../utils/fetchNui";

const rem = (px: number) => `${px / 16}rem`;

interface Props {
  duration: number;
  label: string;
  showPercentage?: boolean;
  onComplete: () => void;
}

const useStyles = createStyles((theme) => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.4)',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backdropFilter: 'blur(4px)',
  },
  label: {
    color: theme.colors.gray[3],
    marginTop: rem(8),
    fontSize: rem(14),
    fontWeight: 500,
    textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
  },
  percentage: {
    position: 'absolute',
    fontSize: rem(14),
    fontFamily: theme.fontFamilyMonospace,
    color: theme.white,
    fontWeight: 700,
  }
}));

const CircularProgress: React.FC<Props> = ({ duration, label, showPercentage, onComplete }) => {
  const { classes, theme } = useStyles();
  const progress = useMotionValue(0);
  const percentage = useTransform(progress, [0, 100], [0, 100]);

  // Use framer to drive the "percent" value for the text
  const displayPercent = useTransform(percentage, (latest) => Math.round(latest) + '%');

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: duration / 1000,
      ease: "linear",
      onComplete: () => {
        fetchNui('progressComplete');
        onComplete();
      }
    });
    return () => controls.stop();
  }, [duration, onComplete, progress]);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <Box className={classes.wrapper}>
      <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Track Circle */}
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={theme.colors.dark[4]}
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated Value Circle */}
          <motion.circle
            cx="40"
            cy="40"
            r={radius}
            stroke={theme.colors.blue[6]}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference} // Start empty
            style={{
              strokeDashoffset: useTransform(progress, [0, 100], [circumference, 0])
            }}
          />
        </svg>

        {showPercentage && (
          <motion.div className={classes.percentage}>
            {displayPercent}
          </motion.div>
        )}
      </div>

      {label && <Text className={classes.label}>{label}</Text>}
    </Box>
  );
};

export default CircularProgress;
