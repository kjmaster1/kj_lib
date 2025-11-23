import React from 'react';
import { toast, type ToastPosition } from 'react-hot-toast';
import { useNuiEvent } from './useNuiEvent';
import NotificationItem from '../features/notifications/components/NotificationItem';
import type { NotificationProps } from '../typings';

export const useNotificationListener = () => {
  useNuiEvent<NotificationProps>('notify', (data) => {
    // 1. Validate payload (must have content)
    if (!data.title && !data.description) return;

    // 2. Normalize Duration (default to 3000ms)
    const duration = data.duration ?? 3000;

    // 3. Normalize Position (Legacy support + Type Casting)
    let position: ToastPosition = (data.position as ToastPosition) || 'top-right';

    if (data.position === 'top') position = 'top-center';
    if (data.position === 'bottom') position = 'bottom-center';

    // 4. Trigger Toast
    toast.custom((t) => <NotificationItem t={t} data={data} />, {
      id: data.id?.toString(), // Support updating existing toasts by ID
      duration,
      position,
    });
  });
};
