import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  Card,
  ErrorState,
  LoadingState,
  Screen,
  SegmentedControl,
  type SegmentedOption,
  Text,
} from '@/components';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';
import { formatDate } from '@/utils/dates';

import { useGetTaskQuery, useUpdateTaskStatusMutation } from '../api/tasksApi';
import { isOverdue } from '../components/TaskCard';
import { priorityLabel, statusLabel, TASK_STATUSES } from '../labels';
import type { TaskStatus } from '../types';

export function TaskDetailsScreen({
  route,
}: RootStackScreenProps<'TaskDetails'>) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const {
    data: task,
    error,
    isLoading,
    refetch,
  } = useGetTaskQuery(route.params.id);
  const [updateStatus, updateState] = useUpdateTaskStatusMutation();

  if (isLoading) {
    return <LoadingState />;
  }
  if (error || !task) {
    return <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />;
  }

  const statusOptions: SegmentedOption<TaskStatus>[] = TASK_STATUSES.map(
    value => ({
      value,
      label: statusLabel(value, t),
      testID: testIDs.taskDetails.statusOption(value),
    }),
  );

  return (
    <Screen scroll testID={testIDs.taskDetails.screen}>
      <Text variant="title" testID={testIDs.taskDetails.title}>
        {task.title}
      </Text>
      <Text>{task.description}</Text>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('tasks.status')}
        </Text>
        <SegmentedControl
          accessibilityLabel={t('tasks.status')}
          options={statusOptions}
          value={task.status}
          onChange={value => updateStatus({ id: task.id, status: value })}
        />
        {updateState.error ? (
          <Text tone="danger">{getErrorMessage(updateState.error, t)}</Text>
        ) : null}
      </View>

      <Card>
        <InfoRow
          label={t('tasks.dueDate')}
          value={formatDate(task.dueDate, i18n.language)}
          danger={isOverdue(task)}
        />
        <InfoRow
          label={t('tasks.priority')}
          value={priorityLabel(task.priority, t)}
        />
        <InfoRow label={t('tasks.assignee')} value={task.assignee.name} />
      </Card>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text tone="muted">{label}</Text>
      <Text tone={danger ? 'danger' : 'default'}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
}));
