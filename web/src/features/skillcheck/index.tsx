// web/src/features/skillcheck/index.tsx
import React, {useEffect, useState} from 'react';
import {Box, createStyles, Transition} from '@mantine/core';
import {useUiStore} from '../../store/uiStore';
import {useShallow} from 'zustand/react/shallow';
import {fetchNui} from '../../utils/fetchNui';
import GameCanvas from './components/GameCanvas';
import {useSkillCheckGame} from "../../hooks/useSkillCheckGame";

const rem = (px: number) => `${px / 16}rem`;

const useStyles = createStyles((theme) => ({
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 1000,
  },
  keyPrompt: {
    marginTop: rem(20),
    padding: `${rem(4)} ${rem(12)}`,
    backgroundColor: theme.colors.dark[8],
    borderRadius: theme.radius.sm,
    color: theme.white,
    fontWeight: 700,
    fontSize: rem(20),
    textTransform: 'uppercase',
    boxShadow: theme.shadows.md,
  }
}));

const SkillCheck: React.FC = () => {
  const {classes} = useStyles();

  // 1. Get State from Store
  const {visible, difficultyChain, activeIndex, closeSkillCheck} = useUiStore(useShallow(state => ({
    visible: state.skillCheck.visible,
    difficultyChain: state.skillCheck.difficultyChain, // Array of difficulties
    activeIndex: state.skillCheck.activeIndex,
    closeSkillCheck: state.skillCheck.closeSkillCheck, // Should reset state
  })));

  // 2. Local Round State
  const [zoneAngle, setZoneAngle] = useState(0);

  const currentDifficulty = difficultyChain[activeIndex] || 'easy';
  const zoneSize = typeof currentDifficulty === 'object' ? currentDifficulty.areaSize : (
    currentDifficulty === 'easy' ? 50 : currentDifficulty === 'medium' ? 40 : 25
  );

  // 3. Initialize Round (Randomize Zone)
  useEffect(() => {
    if (visible) {
      // Random angle between 120 and (360 - size)
      const random = Math.floor(Math.random() * (240 - zoneSize)) + 120;
      setZoneAngle(random);
    }
  }, [visible, activeIndex, zoneSize]);

  // 4. Game Logic Hook
  const {indicatorRef, angleRef} = useSkillCheckGame({
    active: visible,
    difficulty: currentDifficulty,
    onSuccess: () => {
    }, // Handled in key listener below
    onFail: () => {
      closeSkillCheck();
    }
  });

  // 5. Input Listener (Collision Logic)
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return; // Hardcoded 'E' for consistency, can be dynamic

      const currentAngle = angleRef.current;
      const targetStart = zoneAngle;
      const targetEnd = zoneAngle + zoneSize;

      // Check Collision
      if (currentAngle >= targetStart && currentAngle <= targetEnd) {
        // Success
        const nextIndex = activeIndex + 1;
        if (nextIndex >= difficultyChain.length) {
          // All rounds complete
          void fetchNui('skillCheckOver', true);
          closeSkillCheck();
        } else {
          // Move to next round (Store action needed)
          useUiStore.getState().skillCheck.incrementSkillCheck()
        }
      } else {
        // Fail
        void fetchNui('skillCheckOver', false);
        closeSkillCheck();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, zoneAngle, zoneSize, activeIndex, difficultyChain, closeSkillCheck]);

  if (!visible) return null;

  return (
    <Transition mounted={visible} transition="pop" duration={200}>
      {(styles) => (
        <Box className={classes.overlay} style={styles}>
          <GameCanvas
            zoneStartAngle={zoneAngle}
            zoneLengthAngle={zoneSize}
            indicatorRef={indicatorRef}
          />
          <Box className={classes.keyPrompt}>E</Box>
        </Box>
      )}
    </Transition>
  );
};

export default SkillCheck;
