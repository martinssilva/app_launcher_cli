import { addDays, todayString } from '@/utils/dates';

/** In-memory data of the office mock routes (agenda, tasks, documents). */
export interface MockEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

export type MockTaskStatus = 'todo' | 'in_progress' | 'done';
export type MockTaskPriority = 'low' | 'medium' | 'high';

export interface MockPerson {
  id: string;
  name: string;
}

export interface MockTask {
  id: string;
  title: string;
  description: string;
  status: MockTaskStatus;
  priority: MockTaskPriority;
  dueDate: string;
  assigneeId: string;
}

export interface MockDocument {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

/** Tasks assigned to this id belong to whoever is signed in. */
export const CURRENT_USER_ID = 'current-user';

export const COLLEAGUES: MockPerson[] = [
  { id: 'u-ana', name: 'Ana Souza' },
  { id: 'u-bruno', name: 'Bruno Lima' },
  { id: 'u-carla', name: 'Carla Mendes' },
];

/** Uploads with these extensions are rejected with 415 (to try the error path). */
export const MOCK_BLOCKED_EXTENSIONS = ['.exe', '.bat'];

function seedEvents(): MockEvent[] {
  const today = todayString();
  return [
    {
      id: 'e1',
      title: 'Daily stand-up',
      date: today,
      startTime: '09:00',
      endTime: '09:15',
      location: 'Meeting room 2',
      description: 'Quick sync with the team.',
    },
    {
      id: 'e2',
      title: 'Client presentation',
      date: today,
      startTime: '14:00',
      endTime: '15:00',
      location: 'Video call',
      description: 'Quarterly results and next steps.',
    },
    {
      id: 'e3',
      title: 'Design review',
      date: addDays(today, 1),
      startTime: '10:00',
      endTime: '11:00',
      location: 'Meeting room 1',
      description: '',
    },
    {
      id: 'e4',
      title: 'One-on-one',
      date: addDays(today, 3),
      startTime: '16:00',
      endTime: '16:30',
      location: '',
      description: '',
    },
    {
      id: 'e5',
      title: 'Budget meeting',
      date: addDays(today, -2),
      startTime: '11:00',
      endTime: '12:00',
      location: 'Finance room',
      description: '',
    },
  ];
}

const TASK_TITLES = [
  'Prepare monthly report',
  'Review supplier contract',
  'Update onboarding guide',
  'Schedule team offsite',
  'Answer client questions',
  'Approve expense reports',
  'Plan next sprint',
  'Clean up shared drive',
];

const STATUSES: MockTaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITIES: MockTaskPriority[] = ['high', 'medium', 'low'];

function seedTasks(): MockTask[] {
  const today = todayString();
  return Array.from({ length: 40 }, (_, index) => {
    const title = TASK_TITLES[index % TASK_TITLES.length] as string;
    const colleague = COLLEAGUES[index % COLLEAGUES.length] as MockPerson;
    return {
      id: `t${index + 1}`,
      title: `${title} #${index + 1}`,
      description: `Details of "${title}". Replace this with your own data.`,
      status: STATUSES[index % STATUSES.length] as MockTaskStatus,
      priority: PRIORITIES[index % PRIORITIES.length] as MockTaskPriority,
      dueDate: addDays(today, (index % 15) - 5),
      assigneeId: index % 2 === 0 ? CURRENT_USER_ID : colleague.id,
    };
  });
}

function seedDocuments(): MockDocument[] {
  const files: [string, string, number][] = [
    ['Company handbook.pdf', 'application/pdf', 2_480_000],
    ['Q3 budget.xlsx', 'application/vnd.ms-excel', 184_000],
    ['Meeting notes.docx', 'application/msword', 42_000],
    ['Office floor plan.png', 'image/png', 920_000],
  ];
  return files.map(([name, mimeType, size], index) => ({
    id: `d${index + 1}`,
    name,
    mimeType,
    size,
    uploadedAt: new Date(Date.now() - (index + 1) * 86_400_000).toISOString(),
    uploadedBy: (COLLEAGUES[index % COLLEAGUES.length] as MockPerson).name,
    url: `https://files.example.com/d${index + 1}/${encodeURIComponent(name)}`,
  }));
}

let idCounter = 100;

export const officeDb = {
  events: seedEvents(),
  tasks: seedTasks(),
  documents: seedDocuments(),
};

export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}${idCounter}`;
}

export function resetOfficeData(): void {
  idCounter = 100;
  officeDb.events = seedEvents();
  officeDb.tasks = seedTasks();
  officeDb.documents = seedDocuments();
}
