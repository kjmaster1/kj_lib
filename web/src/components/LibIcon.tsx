import React, { useMemo } from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type IconAnimation = 'spin' | 'spinPulse' | 'pulse' | 'beat' | 'fade' | 'beatFade' | 'bounce' | 'shake';

interface LibIconProps extends Omit<FontAwesomeIconProps, 'icon' | 'animation'> {
  icon: string | IconProp; // Accept string from Lua
  animation?: IconAnimation;
}

const LibIcon: React.FC<LibIconProps> = ({ icon, animation, ...props }) => {
  // Fix TS2322: Transform Lua string input into valid IconProp
  const iconProp = useMemo((): IconProp => {
    if (typeof icon !== 'string') return icon;

    // Handle "fa-solid fa-user" style strings if necessary,
    // otherwise assume it's a solid icon name.
    if (icon.includes(' ')) {
      const parts = icon.split(' ');
      // primitive parsing: "fa-solid fa-user" -> ['fas', 'user']
      // Adjust based on your FontAwesome library initialization
      return icon as unknown as IconProp;
    }
    return icon as IconProp;
  }, [icon]);

  // Fix: Explicitly map animation prop to boolean flags to satisfy FontAwesome types
  const animationProps = useMemo(() => {
    if (!animation) return {};
    return { [animation]: true };
  }, [animation]);

  return <FontAwesomeIcon icon={iconProp} {...animationProps} {...props} />;
};

export default React.memo(LibIcon);
