import { baseApi } from '@/services/api';

import type { CalendarEvent, DateRange, EventInput } from '../types';

export const agendaApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Event'] })
  .injectEndpoints({
    endpoints: build => ({
      getEvents: build.query<CalendarEvent[], DateRange>({
        query: params => ({ url: '/events', params }),
        providesTags: result => [
          { type: 'Event' as const, id: 'LIST' },
          ...(result?.map(({ id }) => ({ type: 'Event' as const, id })) ?? []),
        ],
      }),
      getEvent: build.query<CalendarEvent, string>({
        query: id => `/events/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Event', id }],
      }),
      createEvent: build.mutation<CalendarEvent, EventInput>({
        query: data => ({ url: '/events', method: 'POST', data }),
        invalidatesTags: [{ type: 'Event', id: 'LIST' }],
      }),
      updateEvent: build.mutation<CalendarEvent, CalendarEvent>({
        query: ({ id, ...data }) => ({
          url: `/events/${encodeURIComponent(id)}`,
          method: 'PATCH',
          data,
        }),
        invalidatesTags: (_result, _error, { id }) => [
          { type: 'Event', id },
          { type: 'Event', id: 'LIST' },
        ],
      }),
      deleteEvent: build.mutation<void, string>({
        query: id => ({
          url: `/events/${encodeURIComponent(id)}`,
          method: 'DELETE',
        }),
        invalidatesTags: (_result, _error, id) => [
          { type: 'Event', id },
          { type: 'Event', id: 'LIST' },
        ],
      }),
    }),
  });

export const {
  useCreateEventMutation,
  useDeleteEventMutation,
  useGetEventQuery,
  useGetEventsQuery,
  useUpdateEventMutation,
} = agendaApi;
