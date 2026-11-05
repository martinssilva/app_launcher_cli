export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type DueFilter = 'all' | 'overdue' | 'today' | 'week';

export interface Person {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** `YYYY-MM-DD` (local date). */
  dueDate: string;
  assignee: Person;
}

export interface TaskFilters {
  search: string;
  status: TaskStatus | 'all';
  assignee: 'me' | 'all';
  due: DueFilter;
}

export interface TaskPage {
  data: Task[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
