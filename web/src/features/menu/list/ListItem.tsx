import React, { useMemo } from 'react';
import { Box, Group, Progress, Stack, Text, createStyles } from '@mantine/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import LibIcon from '../../../components/LibIcon';
import CustomCheckbox from './CustomCheckbox';
import type { MenuItem } from '../../../typings';
import { isIconUrl } from '../../../utils/isIconUrl';

const rem = (px: number) => `${px / 16}rem`;

// Define the Props to match your new ListMenu usage
interface ListItemProps {
  item: MenuItem;
  active: boolean;
  // Optional: These might not be passed for simple items, so we mark them optional
  scrollIndex?: number;
  checked?: boolean;
}

const useStyles = createStyles((theme, params: { active: boolean; iconColor?: string }) => ({
  container: {
    backgroundColor: params.active ? theme.colors.dark[4] : theme.colors.dark[6],
    borderRadius: theme.radius.md,
    padding: rem(2),
    height: rem(60),
    transition: 'background-color 0.1s ease',
    // We remove the :focus styles because 'active' prop now handles it
  },
  wrapper: {
    paddingLeft: rem(5),
    paddingRight: rem(12),
    height: '100%',
  },
  iconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: rem(32),
    height: rem(32),
  },
  icon: {
    fontSize: rem(24),
    color: params.active ? theme.white : params.iconColor || theme.colors.dark[2],
  },
  label: {
    color: params.active ? theme.white : theme.colors.dark[2],
    textTransform: 'uppercase',
    fontSize: rem(12),
    fontWeight: params.active ? 600 : 400,
    lineHeight: 1.2,
  },
  valueText: {
    color: params.active ? theme.colors.blue[2] : theme.colors.dark[1],
    textTransform: 'uppercase',
    fontSize: rem(14),
  },
  pagination: {
    fontSize: rem(14),
    color: params.active ? theme.white : theme.colors.dark[2],
  },
  chevron: {
    fontSize: rem(14),
    color: params.active ? theme.white : theme.colors.dark[2],
  },
}));

const ListItem: React.FC<ListItemProps> = ({ item, active, scrollIndex = 0, checked = false }) => {
  const { classes } = useStyles({ active, iconColor: item.iconColor });

  // Helper to render the specific value of a list item (slider)
  const renderValue = useMemo(() => {
    if (!item.values || item.values.length === 0) return null;
    const current = item.values[scrollIndex];
    if (typeof current === 'string') return current;
    return current?.label || 'Unknown';
  }, [item.values, scrollIndex]);

  return (
    <Box className={classes.container}>
      <Group spacing={15} noWrap className={classes.wrapper}>

        {/* ICON SECTION */}
        {item.icon && (
          <Box className={classes.iconBox}>
            {typeof item.icon === 'string' && isIconUrl(item.icon) ? (
              <img src={item.icon} alt="icon" style={{ maxWidth: '100%' }} />
            ) : (
              <LibIcon
                icon={item.icon as IconProp}
                className={classes.icon}
                fixedWidth
                animation={item.iconAnimation}
              />
            )}
          </Box>
        )}

        {/* CONTENT SECTION */}
        <Box sx={{ flex: 1 }}>
          {/* TYPE: LIST (SLIDER) */}
          {Array.isArray(item.values) ? (
              <Group position="apart" w="100%" noWrap>
                <Stack spacing={0}>
                  <Text className={classes.label}>{item.label}</Text>
                  <Text className={classes.valueText}>{renderValue}</Text>
                </Stack>
                <Group spacing={4}>
                  <LibIcon icon="chevron-left" className={classes.chevron} />
                  <Text className={classes.pagination}>
                    {scrollIndex + 1}/{item.values.length}
                  </Text>
                  <LibIcon icon="chevron-right" className={classes.chevron} />
                </Group>
              </Group>
            ) :

            /* TYPE: CHECKBOX */
            item.checked !== undefined ? (
                <Group position="apart" w="100%">
                  <Text className={classes.label}>{item.label}</Text>
                  <CustomCheckbox checked={checked} />
                </Group>
              ) :

              /* TYPE: PROGRESS */
              item.progress !== undefined ? (
                <Stack spacing={2} w="100%">
                  <Text className={classes.label}>{item.label}</Text>
                  <Progress
                    value={item.progress}
                    color={item.colorScheme || 'blue'}
                    size="sm"
                    styles={(theme) => ({
                      root: { backgroundColor: theme.colors.dark[4] },
                      bar: { transition: 'width 0.2s' }
                    })}
                  />
                </Stack>
              ) : (

                /* TYPE: STANDARD BUTTON */
                <Text className={classes.label} sx={{ fontSize: rem(14) }}>
                  {item.label}
                </Text>
              )}
        </Box>
      </Group>
    </Box>
  );
};

export default React.memo(ListItem);
