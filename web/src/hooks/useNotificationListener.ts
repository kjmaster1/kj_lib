// web/src/hooks/useNotificationListener.ts
import { toast } from 'react-hot-toast';
import { useNuiEvent } from './useNuiEvent';
import NotificationItem from '../features/notifications/components/NotificationItem';
import type { NotificationProps } from '../typings';

export const useNotificationListener = () => {
  useNuiEvent<NotificationProps>('notify', (data) => {
    // Validate payload
    if (!data.title && !data.description) return;

    const duration = data.duration || 3000;

    // Normalize position legacy strings
    let position = data.position || 'top-right';
    if (position === 'top') position = 'top-center';
    if (position === 'bottom') position = 'bottom-center';

    toast.custom((t) => <NotificationItem t={t} data={data} />, {
    id: data.id?.toString(), // Allows updating existing toasts if ID matches
      duration,
      position,
  });
});
};
