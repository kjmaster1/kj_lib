//
import { useEffect, useRef, useCallback } from 'react';
import { GameDifficulty } from '../typings';

interface UseSkillCheckGameOptions {
  active: boolean;
  difficulty: GameDifficulty;
}

export const useSkillCheckGame = ({ active, difficulty }: UseSkillCheckGameOptions) => {
  const requestRef = useRef<number>();
  const angleRef = useRef(0); // Always kept between 0 and 360
  const indicatorRef = useRef<SVGCircleElement>(null);

  const config = typeof difficulty === 'object' ? difficulty : {
    areaSize: difficulty === 'easy' ? 50 : difficulty === 'medium' ? 40 : 25,
    speedMultiplier: difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.5 : 2.0
  };

  const speed = config.speedMultiplier * 2;

  const animate = useCallback(() => {
    if (!active) return;

    // Increment angle
    let newAngle = angleRef.current + speed;

    // Wrap around 360 to prevent number overflow and simplify logic
    if (newAngle >= 360) {
      newAngle = newAngle % 360;
    }

    angleRef.current = newAngle;

    if (indicatorRef.current) {
      // Visuals: -90 offset for top-start (12 o'clock)
      indicatorRef.current.style.transform = `rotate(${angleRef.current - 90}deg)`;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [active, speed]);

  // Reset only on mount/activate
  useEffect(() => {
    if (active) {
      angleRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [active, animate]);

  // Return ref to read current angle (0-360)
  return { indicatorRef, angleRef };
};
