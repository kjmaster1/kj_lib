//
import React, { useMemo } from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type IconAnimation = 'spin' | 'spinPulse' | 'pulse' | 'beat' | 'fade' | 'beatFade' | 'bounce' | 'shake';

interface LibIconProps extends Omit<FontAwesomeIconProps, 'icon' | 'animation'> {
  icon: string | IconProp;
  animation?: IconAnimation;
}

const LibIcon: React.FC<LibIconProps> = ({ icon, animation, ...props }) => {
  const iconProp = useMemo((): IconProp | null => {
    if (!icon) return null;
    if (typeof icon !== 'string') return icon;

    // Handle "fa-solid fa-user" -> ['fas', 'user']
    if (icon.includes(' ')) {
      const parts = icon.split(' ');
      if (parts.length === 2) {
        const prefixMap: Record<string, 'fas' | 'far' | 'fab'> = {
          'fa-solid': 'fas',
          'fa-regular': 'far',
          'fa-brands': 'fab',
          'fas': 'fas',
          'far': 'far',
          'fab': 'fab'
        };
        const prefix = prefixMap[parts[0]];
        const name = parts[1].replace('fa-', '');
        if (prefix && name) {
          return [prefix, name] as IconProp;
        }
      }
    }

    // Default simple string "user" -> "user"
    return icon as IconProp;
  }, [icon]);

  const animationProps = useMemo(() => {
    if (!animation) return {};
    return { [animation]: true };
  }, [animation]);

  if (!iconProp) return null;

  return <FontAwesomeIcon icon={iconProp} {...animationProps} {...props} />;
};

export default React.memo(LibIcon);
