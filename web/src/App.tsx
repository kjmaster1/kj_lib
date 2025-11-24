import React, { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import { isEnvBrowser } from './utils/misc';
import { fetchNui } from './utils/fetchNui';

// Providers
import ConfigProvider, { useConfig } from './providers/ConfigProvider';
import LocaleProvider from './providers/LocaleProvider';

// Logic Layer
import NuiController from './controllers/NuiController';

// Features
import Notifications from './features/notifications/Notifications';
import TextUI from './features/textui/TextUI';
import ProgressContainer from './features/progress/ProgressContainer';
import SkillCheck from './features/skillcheck';
import RadialMenu from './features/menu/radial';
import ContextMenu from './features/menu/context/ContextMenu';
import ListMenu from './features/menu/list';
import InputDialog from './features/dialog/InputDialog';
import AlertDialog from './features/dialog/AlertDialog';
import Dev from './features/dev';

/**
 * Wraps MantineProvider to access the ConfigContext.
 * This allows the theme to update dynamically based on server settings (e.g. primaryColor).
 */
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { config } = useConfig();

  // Merge static defaults with dynamic server config
  const mergedTheme = { ...theme, ...config };

  return (
    <MantineProvider theme={mergedTheme}>
      {children}
    </MantineProvider>
  );
};

const App: React.FC = () => {
  // Initial Handshake: Tell the Lua client the React app is ready
  useEffect(() => {
    fetchNui('init').catch(() => console.error('NUI Init failed'));
  }, []);

  return (
    <LocaleProvider>
      <ConfigProvider>
        <ThemeWrapper>
          {/* 1. Logic Controller (Invisible, handles NUI Events & Store Sync) */}
          <NuiController />

          {/* 2. Interactive Menus (Standard Layer) */}
          <RadialMenu />
          <ContextMenu />
          <ListMenu />

          {/* 3. HUD Elements (Overlay Layer) */}
          <TextUI />
          <ProgressContainer />
          <SkillCheck />

          {/* 4. Modals (Blocking Layer) */}
          <AlertDialog />
          <InputDialog />

          {/* 5. Notifications (Topmost Layer) */}
          <Notifications />

          {/* 6. Development Tools (Browser Only) */}
          {isEnvBrowser() && <Dev />}
        </ThemeWrapper>
      </ConfigProvider>
    </LocaleProvider>
  );
};

export default App;
