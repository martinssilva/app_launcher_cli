import { addDays, isValidDateString, todayString } from '@/utils/dates';

import { findSession, mockDb, type MockUser } from '../db';
import type { MockRequest, MockResponse, MockRoute } from '../handlers';
import {
  COLLEAGUES,
  CURRENT_USER_ID,
  MOCK_BLOCKED_EXTENSIONS,
  type MockEvent,
  type MockTask,
  type MockTaskStatus,
  nextId,
  officeDb,
} from './data';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const TASK_STATUSES: MockTaskStatus[] = ['todo', 'in_progress', 'done'];

const unauthorized: MockResponse = {
  status: 401,
  data: { message: 'Unauthorized' },
};
const notFound = (what: string): MockResponse => ({
  status: 404,
  data: { message: `${what} not found` },
});

function sessionUser(request: MockRequest): MockUser | undefined {
  const token = request.authorization?.replace(/^Bearer\s+/i, '');
  return token ? findSession(token)?.user : undefined;
}

/** Wraps a handler so it only runs for signed-in users. */
function authed(
  handler: (request: MockRequest, user: MockUser) => MockResponse,
): (request: MockRequest) => MockResponse {
  return request => {
    const user = sessionUser(request);
    return user ? handler(request, user) : unauthorized;
  };
}

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null
    ? (body as Record<string, unknown>)[name]
    : undefined;
}

function text(body: unknown, name: string): string {
  const value = field(body, name);
  return typeof value === 'string' ? value.trim() : '';
}

// ---------------------------------------------------------------- events

function readEvent(body: unknown): Omit<MockEvent, 'id'> | null {
  const event = {
    title: text(body, 'title'),
    date: text(body, 'date'),
    startTime: text(body, 'startTime'),
    endTime: text(body, 'endTime'),
    location: text(body, 'location'),
    description: text(body, 'description'),
  };
  const valid =
    event.title.length > 0 &&
    isValidDateString(event.date) &&
    TIME.test(event.startTime) &&
    TIME.test(event.endTime) &&
    event.endTime > event.startTime;
  return valid ? event : null;
}

const byDateAndTime = (a: MockEvent, b: MockEvent) =>
  a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);

// ----------------------------------------------------------------- tasks

function serializeTask(task: MockTask, user: MockUser) {
  const { assigneeId, ...rest } = task;
  const assignee =
    assigneeId === CURRENT_USER_ID
      ? { id: user.id, name: user.name }
      : (COLLEAGUES.find(person => person.id === assigneeId) ?? {
          id: assigneeId,
          name: 'Unknown',
        });
  return { ...rest, assignee };
}

function matchesDue(task: MockTask, due: unknown): boolean {
  const today = todayString();
  switch (due) {
    case 'overdue':
      return task.status !== 'done' && task.dueDate < today;
    case 'today':
      return task.dueDate === today;
    case 'week':
      return task.dueDate >= today && task.dueDate <= addDays(today, 6);
    default:
      return true;
  }
}

// ------------------------------------------------------------- documents

interface UploadedFile {
  name: string;
  type: string;
}

/** Reads the `file` part of a React Native FormData body. */
function readUploadedFile(body: unknown): UploadedFile | null {
  const form = body as {
    getParts?: () => { fieldName: string; name?: string; type?: string }[];
  };
  const part = form?.getParts?.().find(({ fieldName }) => fieldName === 'file');
  return part?.name
    ? { name: part.name, type: part.type ?? 'application/octet-stream' }
    : null;
}

// ---------------------------------------------------------------- routes

export const officeMockRoutes: MockRoute[] = [
  // Agenda
  {
    method: 'GET',
    path: '/events',
    handler: authed(({ query }) => {
      const from = typeof query.from === 'string' ? query.from : '0000-00-00';
      const to = typeof query.to === 'string' ? query.to : '9999-99-99';
      const events = officeDb.events
        .filter(event => event.date >= from && event.date <= to)
        .sort(byDateAndTime);
      return { status: 200, data: events };
    }),
  },
  {
    method: 'GET',
    path: '/events/:id',
    handler: authed(({ params }) => {
      const event = officeDb.events.find(({ id }) => id === params.id);
      return event ? { status: 200, data: event } : notFound('Event');
    }),
  },
  {
    method: 'POST',
    path: '/events',
    handler: authed(({ body }) => {
      const input = readEvent(body);
      if (!input) {
        return { status: 422, data: { message: 'Invalid event' } };
      }
      const event: MockEvent = { id: nextId('e'), ...input };
      officeDb.events.push(event);
      return { status: 201, data: event };
    }),
  },
  {
    method: 'PATCH',
    path: '/events/:id',
    handler: authed(({ params, body }) => {
      const event = officeDb.events.find(({ id }) => id === params.id);
      if (!event) {
        return notFound('Event');
      }
      const input = readEvent({ ...event, ...(body as object) });
      if (!input) {
        return { status: 422, data: { message: 'Invalid event' } };
      }
      Object.assign(event, input);
      return { status: 200, data: event };
    }),
  },
  {
    method: 'DELETE',
    path: '/events/:id',
    handler: authed(({ params }) => {
      const before = officeDb.events.length;
      officeDb.events = officeDb.events.filter(({ id }) => id !== params.id);
      return officeDb.events.length < before
        ? { status: 204 }
        : notFound('Event');
    }),
  },

  // Tasks
  {
    method: 'GET',
    path: '/tasks',
    handler: authed(({ query }, user) => {
      const search = String(query.search ?? '')
        .trim()
        .toLowerCase();
      const page = Math.max(1, Number(query.page ?? 1) || 1);
      const limit = Math.max(1, Number(query.limit ?? 15) || 15);
      const filtered = officeDb.tasks
        .filter(
          task =>
            !search ||
            task.title.toLowerCase().includes(search) ||
            task.description.toLowerCase().includes(search),
        )
        .filter(
          task =>
            !TASK_STATUSES.includes(query.status as MockTaskStatus) ||
            task.status === query.status,
        )
        .filter(
          task =>
            query.assignee !== 'me' || task.assigneeId === CURRENT_USER_ID,
        )
        .filter(task => matchesDue(task, query.due))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const start = (page - 1) * limit;
      return {
        status: 200,
        data: {
          data: filtered
            .slice(start, start + limit)
            .map(task => serializeTask(task, user)),
          page,
          limit,
          total: filtered.length,
          hasMore: start + limit < filtered.length,
        },
      };
    }),
  },
  {
    method: 'GET',
    path: '/tasks/:id',
    handler: authed(({ params }, user) => {
      const task = officeDb.tasks.find(({ id }) => id === params.id);
      return task
        ? { status: 200, data: serializeTask(task, user) }
        : notFound('Task');
    }),
  },
  {
    method: 'PATCH',
    path: '/tasks/:id',
    handler: authed(({ params, body }, user) => {
      const task = officeDb.tasks.find(({ id }) => id === params.id);
      if (!task) {
        return notFound('Task');
      }
      const status = field(body, 'status');
      if (!TASK_STATUSES.includes(status as MockTaskStatus)) {
        return { status: 422, data: { message: 'Invalid status' } };
      }
      task.status = status as MockTaskStatus;
      return { status: 200, data: serializeTask(task, user) };
    }),
  },

  // Documents
  {
    method: 'GET',
    path: '/documents',
    handler: authed(() => ({
      status: 200,
      data: [...officeDb.documents].sort((a, b) =>
        b.uploadedAt.localeCompare(a.uploadedAt),
      ),
    })),
  },
  {
    method: 'POST',
    path: '/documents',
    handler: authed(({ body }, user) => {
      const file = readUploadedFile(body);
      if (!file) {
        return { status: 422, data: { message: 'Missing file' } };
      }
      const lowerName = file.name.toLowerCase();
      if (MOCK_BLOCKED_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
        return { status: 415, data: { message: 'Unsupported file type' } };
      }
      const id = nextId('d');
      const document = {
        id,
        name: file.name,
        mimeType: file.type,
        size: 256_000,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.name,
        url: `https://files.example.com/${id}/${encodeURIComponent(file.name)}`,
      };
      officeDb.documents.push(document);
      return { status: 201, data: document };
    }),
  },
  {
    method: 'DELETE',
    path: '/documents/:id',
    handler: authed(({ params }) => {
      const before = officeDb.documents.length;
      officeDb.documents = officeDb.documents.filter(
        ({ id }) => id !== params.id,
      );
      return officeDb.documents.length < before
        ? { status: 204 }
        : notFound('Document');
    }),
  },

  // Account
  {
    method: 'PATCH',
    path: '/me',
    handler: authed(({ body }, user) => {
      const name = text(body, 'name');
      const email = text(body, 'email').toLowerCase();
      if (!name || !email.includes('@')) {
        return { status: 422, data: { message: 'Invalid data' } };
      }
      const owner = mockDb.users.get(email);
      if (owner && owner !== user) {
        return { status: 409, data: { message: 'E-mail already registered' } };
      }
      mockDb.users.delete(user.email);
      // The session keeps a reference to this object, so later calls see the change.
      Object.assign(user, { name, email });
      mockDb.users.set(email, user);
      return { status: 200, data: user };
    }),
  },
  {
    method: 'POST',
    path: '/auth/change-password',
    handler: authed(({ body }) => {
      // Not 401: that status would make the app try to refresh the session.
      if (text(body, 'currentPassword') === 'wrong-password') {
        return {
          status: 400,
          data: { message: 'Current password is incorrect' },
        };
      }
      if (text(body, 'newPassword').length < 6) {
        return { status: 422, data: { message: 'Invalid password' } };
      }
      return { status: 204 };
    }),
  },
];
