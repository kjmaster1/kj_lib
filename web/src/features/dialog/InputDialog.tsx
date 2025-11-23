//
import React, { useMemo } from 'react';
import { Button, Group, Modal, Stack } from '@mantine/core';
import { useForm, useFieldArray } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore, UiState } from '../../store/uiStore';
import { fetchNui } from '../../utils/fetchNui';
import { useLocales } from '../../providers/LocaleProvider';
import { getFieldComponent } from './components/FieldRegistry';
import { prepareFormValues, formatSubmissionValues } from './utils/formUtils';
import type { InputProps, FormValues } from '../../typings';

const InputDialog: React.FC = () => {
  const { locale } = useLocales();

  // Select only the input slice to prevent unnecessary re-renders
  const input = useUiStore(useShallow((state: UiState) => state.input));

  // FIXED: Calculate form values immediately.
  // This prevents the "undefined" gap between mount and useEffect which causes "uncontrolled" warnings.
  const currentRows = useMemo(() => {
    return input.data ? prepareFormValues(input.data.rows) : [];
  }, [input.data]);

  const form = useForm<FormValues>({
    defaultValues: { rows: [] },
    values: { rows: currentRows }, // RHF v7: Automatically updates form when this changes
    resetOptions: {
      keepDirty: false, // Ensure we overwrite with new data when opening a new dialog
    }
  });

  const { control, register, handleSubmit } = form;

  useFieldArray({
    control,
    name: 'rows',
  });

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
