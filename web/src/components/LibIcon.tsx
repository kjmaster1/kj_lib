import React from 'react';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';

export type IconAnimation =
  | 'spin'
  | 'spinPulse'
  | 'spinReverse'
  | 'pulse'
  | 'beat'
  | 'fade'
  | 'beatFade'
  | 'bounce'
  | 'shake';

// We Omit the raw boolean props (like 'spin', 'beat') from the interface
// to enforce consistency: developers must use the 'animation' prop.
type BaseProps = Omit<FontAwesomeIconProps, IconAnimation>;

interface LibIconProps extends BaseProps {
  animation?: IconAnimation;
}

const LibIcon: React.FC<LibIconProps> = ({ animation, ...props }) => {
  // Dynamically construct the prop object.
  // e.g. animation="beat" becomes { beat: true }
  // This replaces the 15-line manual mapping object.
  const animationProp = animation ? { [animation]: true } : {};

  return <FontAwesomeIcon {...props} {...animationProp} />;
};

// Memoize to prevent unnecessary re-renders in large lists/menus
export default React.memo(LibIcon);
