import React, { memo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components';
import { makeStyles } from '@/theme';
import { formatDate, todayString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

import { priorityLabel, statusLabel } from '../labels';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
}

export function isOverdue(task: Task): boolean {
  return task.status !== 'done' && task.dueDate < todayString();
}

function TaskCardComponent({ task, onPress }: TaskCardProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const date = formatDate(task.dueDate, i18n.language);
  const overdue = isOverdue(task);

  return (
    <Card
      onPress={() => onPress(task)}
      accessibilityLabel={task.title}
      testID={testIDs.tasks.item(task.id)}
    >
      <View style={styles.row}>
        <Text variant="subtitle" style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <Text
          variant="caption"
          tone={task.status === 'done' ? 'success' : 'primary'}
        >
          {statusLabel(task.status, t)}
        </Text>
      </View>
      <Text variant="caption" tone={overdue ? 'danger' : 'muted'}>
        {overdue ? t('tasks.overdue', { date }) : t('tasks.dueOn', { date })}
        {' · '}
        {priorityLabel(task.priority, t)}
      </Text>
      <Text variant="caption" tone="muted">
        {task.assignee.name}
      </Text>
    </Card>
  );
}

export const TaskCard = memo(TaskCardComponent);

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
  },
}));
