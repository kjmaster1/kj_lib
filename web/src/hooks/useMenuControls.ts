// web/src/hooks/useMenuControls.ts
import { useEffect, useState } from 'react';
import { fetchNui } from '../utils/fetchNui';

export const useMenuControls = (itemCount: number, active: boolean) => {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault(); // Stop GTA web scrolling
      switch (e.code) {
        case 'ArrowUp':
          setSelected((prev) => (prev <= 0 ? itemCount - 1 : prev - 1));
          break;
        case 'ArrowDown':
          setSelected((prev) => (prev >= itemCount - 1 ? 0 : prev + 1));
          break;
        case 'Enter':
          void fetchNui('confirmSelected', { index: selected });
          break;
        case 'Backspace':
        case 'Escape':
          void fetchNui('closeMenu');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, itemCount, selected]);

  // Effect to notify client of selection change (Debounce this in production!)
  useEffect(() => {
    if(active) void fetchNui('changeSelected', { index: selected });
  }, [selected, active]);

  return { selected };
};
