import React, { useEffect } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';
import { useForm, useFieldArray } from 'react-hook-form';
import { useUiStore } from '../../store/uiStore';
import { fetchNui } from '../../utils/fetchNui';
import { useLocales } from '../../providers/LocaleProvider';
import { getFieldComponent } from './components/FieldRegistry';
import { prepareFormValues, formatSubmissionValues } from './utils/formUtils';
import type { InputProps, FormValues } from '../../typings'; // Ensure type import

const InputDialog: React.FC = () => {
  const { locale } = useLocales();
  const { input } = useUiStore();

  const form = useForm<FormValues>({
    defaultValues: { rows: [] }
  });

  const { control, register, handleSubmit, reset } = form;

  // Fix: Explicitly type fieldArray to avoid 'never' issues
  useFieldArray({
    control,
    name: 'rows',
  });

  // 1. Reset Form when Modal Opens
  useEffect(() => {
    if (input.visible && input.data) {
      const initialRows = prepareFormValues(input.data.rows);
      // Reset only when data actually changes
      reset({ rows: initialRows });
    }
  }, [input.visible, input.data, reset]);

  // 2. Handle Submit
  const onSubmit = handleSubmit((data) => {
    if (!input.data) return;

    const values = formatSubmissionValues(data.rows, input.data.rows);

    void fetchNui('inputData', values);
    input.closeInput();
  });

  const handleCancel = () => {
    void fetchNui('closeInputDialog');
    input.closeInput();
  };

  if (!input.data) return null;

  const { heading, rows, options } = input.data as InputProps;

  return (
    <Modal
      opened={input.visible}
      onClose={handleCancel}
      centered
      closeOnEscape={options?.allowCancel !== false}
      closeOnClickOutside={false}
      size={options?.size || 'xs'}
      styles={{ title: { textAlign: 'center', width: '100%', fontSize: 18 } }}
      title={heading}
      withCloseButton={false}
      overlayOpacity={0.5}
      transition="fade"
      exitTransitionDuration={150}
    >
      <form onSubmit={onSubmit}>
        <Stack spacing="sm">
          {rows.map((row, index) => {
            const Component = getFieldComponent(row.type);

            return (
              <Component
                key={index}
                index={index}
                row={row}
                control={control}
                register={register}
                path={`rows.${index}.value`}
              />
            );
          })}

          <Group position="right" mt="md">
            {options?.allowCancel !== false && (
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
