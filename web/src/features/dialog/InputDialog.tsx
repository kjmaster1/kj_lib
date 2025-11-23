// web/src/features/dialog/InputDialog.tsx
import React, { useEffect } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUiStore } from '../../store/uiStore';
import { fetchNui } from '../../utils/fetchNui';
import { useLocales } from '../../providers/LocaleProvider';
import { getFieldComponent } from './components/FieldRegistry';
import { prepareFormValues, formatSubmissionValues } from './utils/formUtils';

const InputDialog: React.FC = () => {
  const { locale } = useLocales();
  const { input } = useUiStore();

  const form = useForm<{ rows: { value: any }[] }>({
    defaultValues: { rows: [] }
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'rows',
  });

  // 1. Reset Form when Modal Opens
  useEffect(() => {
    if (input.visible && input.data) {
      // Logic extracted to utility to keep component clean
      const initialRows = prepareFormValues(input.data.rows);
      form.reset({ rows: initialRows });
    }
  }, [input.visible, input.data, form]);

  // 2. Handle Submit
  const onSubmit = form.handleSubmit((data) => {
    if (!input.data) return;

    // Transform objects back to the array format the Lua client expects
    const values = formatSubmissionValues(data.rows, input.data.rows);

    void fetchNui('inputData', values);
    input.closeInput();
  });

  const handleCancel = () => {
    void fetchNui('closeInputDialog'); // Notify client of cancellation
    input.closeInput();
  };

  if (!input.data) return null;

  return (
    <Modal
      opened={input.visible}
      onClose={handleCancel}
      centered
      closeOnEscape={input.data.options?.allowCancel !== false}
      closeOnClickOutside={false}
      size={input.data.options?.size || 'xs'}
      styles={{ title: { textAlign: 'center', width: '100%', fontSize: 18 } }}
      title={input.data.heading}
      withCloseButton={false}
      overlayOpacity={0.5}
      transition="fade"
      exitTransitionDuration={150}
    >
      <form onSubmit={onSubmit}>
        <Stack spacing="sm">
          {input.data.rows.map((row, index) => {
            const Component = getFieldComponent(row.type);

            return (
              <Component
                key={index}
                index={index}
                row={row}
                control={form.control}
                register={form.register}
                // We pass the specific register path for this row
                // The field components should use: props.register(`rows.${index}.value`)
                path={`rows.${index}.value`}
              />
            );
          })}

          <Group position="right" mt="md">
            {input.data.options?.allowCancel !== false && (
              <Button variant="default" onClick={handleCancel}>
                {locale.ui.cancel}
              </Button>
            )}
            <Button type="submit">
              {locale.ui.confirm}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default InputDialog;
