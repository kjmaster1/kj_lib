// web/src/hooks/useMenuControls.tsx
import { useEffect, useState } from 'react';
import { fetchNui } from '../utils/fetchNui';
import type { MenuItem } from '../typings';
import {useUiStore} from "../store/uiStore";

export const useMenuControls = (items: MenuItem[], active: boolean) => {
  const [selected, setSelected] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);

  const updateMenuOption = useUiStore((state) => state.menu.updateMenuOption);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for navigation keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Backspace'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowUp': {
          const prevIndex = selected;
          const nextIndex = prevIndex <= 0 ? items.length - 1 : prevIndex - 1;
          setSelected(nextIndex);
          setScrollIndex(items[nextIndex]?.defaultIndex || 0);
          break;
        }
        case 'ArrowDown': {
          const prevIndex = selected;
          const nextIndex = prevIndex >= items.length - 1 ? 0 : prevIndex + 1;
          setSelected(nextIndex);
          setScrollIndex(items[nextIndex]?.defaultIndex || 0);
          break;
        }
        case 'ArrowLeft': {
          const currentItem = items[selected];
          if (currentItem?.values && currentItem.values.length > 0) {
            setScrollIndex((prev) => Math.max(0, prev - 1));
          }
          break;
        }
        case 'ArrowRight': {
          const currentItem = items[selected];
          if (currentItem?.values && currentItem.values.length > 0) {
            setScrollIndex((prev) => Math.min(currentItem.values!.length - 1, prev + 1));
          }
          break;
        }
        case 'Enter': {
          const currentItem = items[selected];

          // 1. If it's a Checkbox, toggle it
          if (currentItem && currentItem.checked !== undefined) {
            const newCheckedState = !currentItem.checked;
            updateMenuOption(selected, { checked: newCheckedState });
            void fetchNui('changeChecked', { index: selected, checked: newCheckedState });
          }
          // 2. Otherwise, confirm selection
          else {
            void fetchNui('confirmSelected', { index: selected, scrollIndex });
          }
          break;
        }
        case 'Backspace':
        case 'Escape':
          void fetchNui('closeMenu');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, items, selected, scrollIndex]);

  // Notify client of row selection change
  useEffect(() => {
    if (active) {
      void fetchNui('changeSelected', { index: selected });
    }
  }, [selected, active]);

  // Notify client of scroll (value) change
  useEffect(() => {
    if (active) {
      void fetchNui('changeIndex', { index: selected, scrollIndex });
    }
  }, [scrollIndex, selected, active]);

  return { selected, scrollIndex };
};
