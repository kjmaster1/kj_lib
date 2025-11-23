import React from 'react';
import { UnstyledButton, Group, Text, createStyles } from '@mantine/core';
import LibIcon from '../../../../components/LibIcon';
import {Option} from "../../../../typings";

const rem = (px: number) => `${px / 16}rem`;

const useStyles = createStyles((theme, params: { disabled?: boolean }) => ({
  button: {
    padding: '8px 12px',
    borderRadius: theme.radius.sm,
    width: '100%',
    opacity: params.disabled ? 0.5 : 1,
    cursor: params.disabled ? 'not-allowed' : 'pointer',
    '&:hover': {
      backgroundColor: !params.disabled ? theme.colors.dark[5] : 'transparent',
    },
  },
  label: {
    fontSize: rem(14),
    fontWeight: 500,
    color: theme.colors.gray[3],
  },
  description: {
    fontSize: rem(12),
    color: theme.colors.dark[2],
  }
}));

interface Props {
  item: Option;
  onClick: () => void;
}

const ContextButton: React.FC<Props> = ({ item, onClick }) => {
  const { classes } = useStyles({ disabled: item.disabled });

  return (
    <UnstyledButton className={classes.button} onClick={item.disabled ? undefined : onClick}>
      <Group noWrap>
        {item.icon && (
          <LibIcon
            icon={item.icon}
            color={item.iconColor}
            fixedWidth
          />
        )}
        <div style={{ flex: 1 }}>
          <Text className={classes.label}>{item.title || item.label}</Text>
          {item.description && (
            <Text className={classes.description}>{item.description}</Text>
          )}
        </div>
        {item.arrow && <LibIcon icon="chevron-right" size="xs" color="dimmed" />}
      </Group>
    </UnstyledButton>
  );
};

export default React.memo(ContextButton);
