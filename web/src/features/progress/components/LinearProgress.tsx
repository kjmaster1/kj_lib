// web/src/features/progress/components/LinearProgress.tsx
import React from 'react';
import {Box, createStyles, Text} from '@mantine/core';
import {motion} from 'framer-motion';
import {fetchNui} from "../../../utils/fetchNui";

const rem = (px: number) => `${px / 16}rem`;

interface Props {
  duration: number;
  label: string;
  onComplete: () => void;
}

const useStyles = createStyles((theme) => ({
  container: {
    width: rem(350),
    backgroundColor: theme.colors.dark[6],
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: theme.shadows.lg,
    border: `1px solid ${theme.colors.dark[4]}`,
  },
  bar: {
    height: rem(12),
    backgroundColor: theme.colors.blue[6],
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  label: {
    fontSize: rem(10),
    fontWeight: 700,
    color: theme.white,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
  }
}));

const LinearProgress: React.FC<Props> = ({duration, label, onComplete}) => {
  const {classes} = useStyles();

  return (
    <Box className={classes.container}>
      <motion.div
        className={classes.bar}
        initial={{width: '0%'}}
        animate={{width: '100%'}}
        transition={{duration: duration / 1000, ease: 'linear'}}
        onAnimationComplete={() => {
          void fetchNui('progressComplete');
          onComplete();
        }}
      />
      <div className={classes.labelContainer}>
        <Text className={classes.label}>{label}</Text>
      </div>
    </Box>
  );
};

export default LinearProgress;
