import { baseApi } from '@/services/api';

import type { Task, TaskFilters, TaskPage, TaskStatus } from '../types';

export const TASKS_PAGE_SIZE = 15;

export const tasksApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Task'] })
  .injectEndpoints({
    endpoints: build => ({
      /** Paginated list: `useGetTasksInfiniteQuery(filters)` + `fetchNextPage()`. */
      getTasks: build.infiniteQuery<TaskPage, TaskFilters, number>({
        infiniteQueryOptions: {
          initialPageParam: 1,
          getNextPageParam: lastPage =>
            lastPage.hasMore ? lastPage.page + 1 : undefined,
        },
        query: ({ queryArg, pageParam }) => ({
          url: '/tasks',
          params: {
            ...(queryArg.search ? { search: queryArg.search } : {}),
            ...(queryArg.status !== 'all' ? { status: queryArg.status } : {}),
            ...(queryArg.assignee !== 'all'
              ? { assignee: queryArg.assignee }
              : {}),
            ...(queryArg.due !== 'all' ? { due: queryArg.due } : {}),
            page: pageParam,
            limit: TASKS_PAGE_SIZE,
          },
        }),
        providesTags: [{ type: 'Task', id: 'LIST' }],
      }),
      getTask: build.query<Task, string>({
        query: id => `/tasks/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Task', id }],
      }),
      updateTaskStatus: build.mutation<
        Task,
        { id: string; status: TaskStatus }
      >({
        query: ({ id, status }) => ({
          url: `/tasks/${encodeURIComponent(id)}`,
          method: 'PATCH',
          data: { status },
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Task', id },
          { type: 'Task', id: 'LIST' },
        ],
      }),
    }),
  });

export const {
  useGetTaskQuery,
  useGetTasksInfiniteQuery,
  useUpdateTaskStatusMutation,
} = tasksApi;
