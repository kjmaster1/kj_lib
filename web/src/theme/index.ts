// web/src/theme/index.ts
import { MantineThemeOverride } from '@mantine/core';

const rem = (px: number) => `${px / 16}rem`;

export const theme: MantineThemeOverride = {
  colorScheme: 'dark',

  // 1. Typography System
  fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'Roboto Mono, Menlo, Monaco, Courier, monospace',
  headings: {
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 700,
    sizes: {
      h1: { fontSize: rem(34), lineHeight: '1.3' },
      h2: { fontSize: rem(26), lineHeight: '1.35' },
      h3: { fontSize: rem(22), lineHeight: '1.4' },
      h4: { fontSize: rem(18), lineHeight: '1.45' },
    },
  },

  // 2. Default Colors & Radius
  primaryColor: 'blue',
  defaultRadius: 'sm',

  // 3. Global Styles (Critical for NUI)
  globalStyles: (theme) => ({
    '*, *::before, *::after': {
      boxSizing: 'border-box',
    },
    body: {
      backgroundColor: 'transparent', // Ensure Game View is visible
      color: theme.colors.dark[0],
      fontSmoothing: 'antialiased',
      overflow: 'hidden', // Prevent scrollbars on the NUI frame
      userSelect: 'none', // Prevent text selection dragging in game
    },
    '::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      background: theme.colors.dark[4],
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: theme.colors.dark[3],
    },
  }),

  // 4. Component Defaults
  components: {
    // Buttons: Make them feel tactile for game menus
    Button: {
      defaultProps: {
        uppercase: true,
      },
      styles: (theme, params) => ({
        root: {
          fontWeight: 600,
          border: 'none',
          transition: 'transform 0.1s ease, background-color 0.2s ease',
          '&:active': {
            transform: 'scale(0.97)', // Click press effect
          },
        },
      }),
    },
    // Tooltips: Game-style floating info
    Tooltip: {
      defaultProps: {
        withArrow: true,
        transition: 'fade',
        transitionDuration: 150,
      },
      styles: (theme) => ({
        tooltip: {
          backgroundColor: theme.colors.dark[7],
          border: `1px solid ${theme.colors.dark[4]}`,
          color: theme.white,
          fontSize: rem(12),
          boxShadow: theme.shadows.md,
        },
        arrow: {
          border: `1px solid ${theme.colors.dark[4]}`,
          backgroundColor: theme.colors.dark[7],
        },
      }),
    },
    // Modals: Standardize headers and overlay
    Modal: {
      styles: (theme) => ({
        header: {
          backgroundColor: theme.colors.dark[7],
          borderBottom: `1px solid ${theme.colors.dark[5]}`,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        },
        title: {
          fontWeight: 700,
          textTransform: 'uppercase',
          fontSize: rem(16),
        },
        body: {
          backgroundColor: theme.colors.dark[7],
          padding: theme.spacing.md,
        },
      }),
    },
    // Inputs: Flat, dark style
    Input: {
      styles: (theme) => ({
        input: {
          backgroundColor: theme.colors.dark[6],
          borderColor: theme.colors.dark[4],
          '&:focus': {
            borderColor: theme.colors[theme.primaryColor][6],
          },
        },
      }),
    },
  },

  // 5. Custom Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
  },
};
