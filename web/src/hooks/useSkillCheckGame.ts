// web/src/features/skillcheck/hooks/useSkillCheckGame.ts
import { useEffect, useRef, useCallback } from 'react';
import {GameDifficulty} from "../typings";
import {fetchNui} from "../utils/fetchNui";

interface UseSkillCheckGameOptions {
  active: boolean;
  difficulty: GameDifficulty;
  onSuccess: () => void;
  onFail: () => void;
}

export const useSkillCheckGame = ({ active, difficulty, onSuccess, onFail }: UseSkillCheckGameOptions) => {
  const requestRef = useRef<number>();
  const angleRef = useRef(0);
  const indicatorRef = useRef<SVGCircleElement>(null);

  // Configuration derived from difficulty
  const config = typeof difficulty === 'object' ? difficulty : {
    areaSize: difficulty === 'easy' ? 50 : difficulty === 'medium' ? 40 : 25,
    speedMultiplier: difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.5 : 2.0
  };

  const speed = config.speedMultiplier * 2; // Base speed adjustment

  // The Game Loop
  const animate = useCallback(() => {
    if (!active) return;

    // Update Angle
    angleRef.current = (angleRef.current + speed);

    // Check if missed (full rotation without press)
    if (angleRef.current > 360) {
      handleFail();
      return;
    }

    // Direct DOM manipulation for 60/144fps performance without React Renders
    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `rotate(${angleRef.current - 90}deg)`;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [active, speed]);

  const handleFail = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    void fetchNui('skillCheckOver', false);
    onFail();
  };

  const handleInput = useCallback((e: KeyboardEvent) => {
    if (!active) return;

    // Use e.code for physical location (e.g. 'KeyE') to support all Keyboard Layouts natively
    // Default valid key is usually Space or E, we can make this configurable
    const validKeys = ['KeyE', 'Space', 'Enter'];
    if (!validKeys.includes(e.code)) return;

    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Collision Detection
    // We generated a random start angle for the zone, effectively rotating the zone.
    // However, it's easier to keep the zone static visualy or conceptually.
    // BUT, usually skill checks have a static "top" start and a random target zone.
    // Let's assume the component props pass the `targetAngle` zone.

    // We trigger the check in the component which has access to the random zone state
    // So we just return the current angle to the caller
    return;
  }, [active]);

  // Start/Stop Loop
  useEffect(() => {
    if (active) {
      angleRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [active, animate]);

  return { indicatorRef, angleRef };
};
