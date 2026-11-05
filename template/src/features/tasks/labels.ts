import type { TFunction } from 'i18next';

import type { TaskPriority, TaskStatus } from './types';

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export function statusLabel(status: TaskStatus, t: TFunction): string {
  const labels: Record<TaskStatus, string> = {
    todo: t('tasks.statusTodo'),
    in_progress: t('tasks.statusInProgress'),
    done: t('tasks.statusDone'),
  };
  return labels[status];
}

export function priorityLabel(priority: TaskPriority, t: TFunction): string {
  const labels: Record<TaskPriority, string> = {
    low: t('tasks.priorityLow'),
    medium: t('tasks.priorityMedium'),
    high: t('tasks.priorityHigh'),
  };
  return labels[priority];
}
