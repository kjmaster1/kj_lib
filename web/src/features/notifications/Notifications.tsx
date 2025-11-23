// web/src/features/notifications/Notifications.tsx
import React from 'react';
import { Toaster } from 'react-hot-toast';

const Notifications: React.FC = () => {
  return (
    <Toaster
      gutter={8}
      containerStyle={{
        top: 20,
        left: 20,
        bottom: 20,
        right: 20,
      }}
      toastOptions={{
        // Remove default styles as we use custom components
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
};

export default Notifications;
