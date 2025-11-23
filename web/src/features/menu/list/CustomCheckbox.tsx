//
import React from 'react';
import { Checkbox, createStyles } from '@mantine/core';

const useStyles = createStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
  },
  input: {
    backgroundColor: theme.colors.dark[7],
    borderColor: theme.colors.dark[4],
    cursor: 'pointer',
    '&:checked': {
      backgroundColor: theme.colors.dark[2],
      borderColor: theme.colors.dark[2],
    },
  },
  inner: {
    '> svg > path': {
      fill: theme.colors.dark[6],
    },
  },
}));

const CustomCheckbox: React.FC<{ checked: boolean }> = ({ checked }) => {
  const { classes } = useStyles();
  return (
    <Checkbox
      checked={checked}
      readOnly // FIXED: Suppress React warning since this is controlled by parent/keyboard
      size="md"
      classNames={{ root: classes.root, input: classes.input, inner: classes.inner }}
      tabIndex={-1} // Prevent focus stealing
    />
  );
};

export default CustomCheckbox;
