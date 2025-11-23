//
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Box, createStyles, Transition } from '@mantine/core';
import { useUiStore, UiState } from '../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchNui } from '../../utils/fetchNui';
import GameCanvas from './components/GameCanvas';
import { useSkillCheckGame } from '../../hooks/useSkillCheckGame';

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
  const { classes } = useStyles();

  const { visible, difficultyChain, activeIndex, inputs, incrementSkillCheck, closeSkillCheck } = useUiStore(
    useShallow((state: UiState) => ({
      visible: state.skillCheck.visible,
      difficultyChain: state.skillCheck.difficultyChain,
      activeIndex: state.skillCheck.activeIndex,
      inputs: state.skillCheck.inputs,
      incrementSkillCheck: state.skillCheck.incrementSkillCheck,
      closeSkillCheck: state.skillCheck.closeSkillCheck,
    }))
  );

  // Game State
  const [zoneAngle, setZoneAngle] = useState(0);
  const [targetKey, setTargetKey] = useState('e');
  const [roundSuccess, setRoundSuccess] = useState(false); // Controls Green Flash

  const roundSuccessRef = useRef(false); // Ref mirror for input blocking

  const currentDifficulty = difficultyChain[activeIndex] || 'easy';
  const zoneSize = typeof currentDifficulty === 'object' ? currentDifficulty.areaSize : (
    currentDifficulty === 'easy' ? 50 : currentDifficulty === 'medium' ? 40 : 25
  );

  const validKeyPool = useMemo(() => {
    return (inputs || ['e']).map(k => k.toLowerCase());
  }, [inputs]);

  // Hook runs the loop
  const { indicatorRef, angleRef } = useSkillCheckGame({
    active: visible,
    difficulty: currentDifficulty
  });

  // --- Logic to Start/Reset a Round ---
  const setupRound = useCallback(() => {
    const currentAngle = angleRef.current; // Current 0-360 position

    // 1. Calculate random offset AHEAD of current position
    // Generate zone between 60 and 180 degrees ahead
    const randomOffset = Math.floor(Math.random() * 120) + 60;
    const nextZoneStart = (currentAngle + randomOffset) % 360;

    setZoneAngle(nextZoneStart);

    // 2. Pick new Key
    const randomKeyIndex = Math.floor(Math.random() * validKeyPool.length);
    setTargetKey(validKeyPool[randomKeyIndex]);

    // 3. Reset Logic
    setRoundSuccess(false);
    roundSuccessRef.current = false;
  }, [validKeyPool]);

  // Initial Setup on mount
  useEffect(() => {
    if (visible) {
      // For the very first round, give a static start zone or random
      const randomStart = Math.floor(Math.random() * 200) + 60;
      setZoneAngle(randomStart);
      setTargetKey(validKeyPool[0]); // Or random
      setRoundSuccess(false);
      roundSuccessRef.current = false;
    }
  }, [visible, validKeyPool]);

  // --- Input Handler ---
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (roundSuccessRef.current) return; // Ignore input during success flash

      const pressedKey = e.key.toLowerCase();
      if (!validKeyPool.includes(pressedKey)) return; // Ignore non-game keys

      // 1. Check Key Match
      if (pressedKey !== targetKey) {
        void fetchNui('skillCheckOver', false);
        closeSkillCheck();
        return;
      }

      // 2. Check Zone Collision
      // angleRef is guaranteed 0-360 by the hook
      const currentAngle = angleRef.current;

      // Handle Wrapping: If zone starts at 350 and ends at 40
      const start = zoneAngle;
      const end = (zoneAngle + zoneSize) % 360;

      let hit = false;
      if (start < end) {
        // Normal case (e.g. 100 to 150)
        hit = currentAngle >= start && currentAngle <= end;
      } else {
        // Wrapped case (e.g. 350 to 40)
        hit = currentAngle >= start || currentAngle <= end;
      }

      if (hit) {
        // SUCCESS!
        roundSuccessRef.current = true;
        setRoundSuccess(true); // Trigger Green Flash

        // Seamlessly transition to next round
        setTimeout(() => {
          const nextIndex = activeIndex + 1;
          if (nextIndex >= difficultyChain.length) {
            void fetchNui('skillCheckOver', true);
            closeSkillCheck();
          } else {
            incrementSkillCheck();
            setupRound();
          }
        }, 150); // 150ms Flash
      } else {
        // FAIL (Missed Zone / Pressed outside)
        void fetchNui('skillCheckOver', false);
        closeSkillCheck();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, zoneAngle, zoneSize, activeIndex, difficultyChain, validKeyPool, targetKey, angleRef, incrementSkillCheck, closeSkillCheck, setupRound]);

  if (!visible) return null;

  return (
    <Transition mounted={visible} transition="pop" duration={200}>
      {(styles) => (
        <Box className={classes.overlay} style={styles}>
          <GameCanvas
            zoneStartAngle={zoneAngle}
            zoneLengthAngle={zoneSize}
            indicatorRef={indicatorRef}
            isSuccess={roundSuccess} // Green flash prop
          />
          <Box
            className={classes.keyPrompt}
            sx={(theme) => ({
              color: roundSuccess ? theme.colors.green[4] : theme.white,
              borderColor: roundSuccess ? theme.colors.green[6] : 'transparent',
              borderWidth: roundSuccess ? 1 : 0,
              borderStyle: 'solid',
              transition: 'all 0.1s ease'
            })}
          >
            {targetKey.toUpperCase()}
          </Box>
        </Box>
      )}
    </Transition>
  );
};

export default SkillCheck;
