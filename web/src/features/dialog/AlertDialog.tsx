// web/src/features/dialog/AlertDialog.tsx
import React, { useMemo } from 'react';
import { Button, Group, Modal, Stack, useMantineTheme } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUiStore } from '../../store/uiStore'; // Use Store!
import { fetchNui } from '../../utils/fetchNui';
import { useLocales } from '../../providers/LocaleProvider';
import MarkdownComponents from '../../config/MarkdownComponents';

const AlertDialog: React.FC = () => {
  const { locale } = useLocales();
  const theme = useMantineTheme();
  // We use the same store mechanism. Assuming you added alertData to uiStore.
  // If not, useUiStore needs: isAlertVisible, alertData, closeAlert
  const { isAlertVisible, alertData, closeAlert } = useUiStore((state: any) => ({
    isAlertVisible: state.isAlertVisible, // You'd need to add these to store
    alertData: state.alertData,
    closeAlert: state.closeAlert
  }));

  // Memoize markdown components to prevent re-renders
  const markdownComponents = useMemo(() => ({
    ...MarkdownComponents,
    img: ({ ...props }: any) => <img style={{ maxWidth: '100%', maxHeight: '100%' }} {...props} />,
  }), []);

  const handleClose = (action: 'cancel' | 'confirm') => {
    closeAlert();
    void fetchNui('closeAlert', action);
  };

  if (!alertData) return null;

  return (
    <Modal
      opened={isAlertVisible}
      centered={alertData.centered}
      size={alertData.size || 'md'}
      overflow={alertData.overflow ? 'inside' : 'outside'}
      closeOnClickOutside={false}
      withCloseButton={false}
      onClose={() => handleClose('cancel')}
      overlayOpacity={0.5}
      transition="fade"
      exitTransitionDuration={150}
      title={
        <ReactMarkdown components={MarkdownComponents}>
          {alertData.header}
        </ReactMarkdown>
      }
    >
      <Stack spacing="md">
        <div style={{ color: theme.colors.dark[2], lineHeight: 1.5 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {alertData.content}
          </ReactMarkdown>
        </div>

        <Group position="right" spacing={10}>
          {alertData.cancel && (
            <Button
              variant="default"
              onClick={() => handleClose('cancel')}
              uppercase
            >
              {alertData.labels?.cancel || locale.ui.cancel}
            </Button>
          )}
          <Button
            variant={alertData.cancel ? 'light' : 'filled'}
            onClick={() => handleClose('confirm')}
            uppercase
          >
            {alertData.labels?.confirm || locale.ui.confirm}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default AlertDialog;
