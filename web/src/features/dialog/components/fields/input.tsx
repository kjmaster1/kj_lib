// web/src/features/dialog/components/fields/input.tsx
import React from 'react';
import { TextInput, PasswordInput, createStyles } from '@mantine/core';
import { UseFormRegister } from 'react-hook-form';
import { IInput } from '../../../../typings';
import LibIcon from '../../../../components/LibIcon';

interface InputFieldProps {
  register: UseFormRegister<any>;
  path: string; // The specific path for this field (e.g., "rows.0.value")
  row: IInput;
}

const useStyles = createStyles((theme) => ({
  eyeIcon: {
    color: theme.colors.dark[2],
    cursor: 'pointer',
  },
}));

const InputField: React.FC<InputFieldProps> = ({ register, path, row }) => {
  const { classes } = useStyles();

  // Choose the component type
  const Component = row.password ? PasswordInput : TextInput;

  return (
    <Component
      {...register(path, { required: row.required })}
      label={row.label}
      description={row.description}
      defaultValue={row.default} // Controlled by form.reset, but safe to keep
      placeholder={row.placeholder}
      minLength={row.min}
      maxLength={row.max}
      disabled={row.disabled}
      withAsterisk={row.required}
      icon={row.icon && <LibIcon icon={row.icon} fixedWidth />}
      visibilityToggleIcon={row.password ? ({ reveal, size }) => (
        <LibIcon
          icon={reveal ? 'eye-slash' : 'eye'}
          style={{ fontSize: size }}
          className={classes.eyeIcon}
          fixedWidth
        />
      ) : undefined}
    />
  );
};

export default InputField;
