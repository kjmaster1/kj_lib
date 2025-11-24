import React from 'react';
import { Checkbox } from '@mantine/core';
import { ICheckbox } from '../../../../typings';
import { Control, Controller } from 'react-hook-form';

interface Props {
  row: ICheckbox;
  index: number;
  control: Control<any>; // We use Control instead of register
  path: string;
}

const CheckboxField: React.FC<Props> = ({ row, control, path }) => {
  return (
    <Controller
      name={path}
      control={control}
      render={({ field: { value, onChange, onBlur, ref } }) => (
        <Checkbox
          ref={ref}
          sx={{ display: 'flex' }}
          label={row.label}
          disabled={row.disabled}
          required={row.required}

          // BINDING LOGIC:
          // 1. Connect the form state (value) to the component (checked)
          checked={!!value}

          // 2. Update the form state when the user interacts
          onChange={(event) => onChange(event.currentTarget.checked)}

          onBlur={onBlur}
        />
      )}
    />
  );
};

export default CheckboxField;
