import type { TimeEntry } from '../types'

export const mockEntries: TimeEntry[] = [
  {
    id: 1,
    project: 'Acme Website Redesign', projectColor: '#c8602a',
    description: 'Homepage layout wireframes — mobile & desktop',
    date: '2026-02-23', startTime: '09:00', endTime: '11:00',
    duration: '2h 00m', status: 'approved',
  },
  {
    id: 2,
    project: 'Backend API v2', projectColor: '#2a5fa8',
    description: 'Auth endpoint refactor + unit tests',
    date: '2026-02-23', startTime: '12:00', endTime: '14:30',
    duration: '2h 30m', status: 'pending',
  },
  {
    id: 3,
    project: 'Mobile App', projectColor: '#2a7a4f',
    description: 'Push notifications & permission flows',
    date: '2026-02-22', startTime: '09:00', endTime: '12:15',
    duration: '3h 15m', status: 'approved',
  },
  {
    id: 4,
    project: 'Data Pipeline', projectColor: '#c87d2a',
    description: 'ETL optimization & batch scheduling',
    date: '2026-02-22', startTime: '13:00', endTime: '15:45',
    duration: '2h 45m', status: 'draft',
  },
  {
    id: 5,
    project: 'Acme Website Redesign', projectColor: '#c8602a',
    description: 'Design review with client feedback',
    date: '2026-02-22', startTime: '16:00', endTime: '18:00',
    duration: '2h 00m', status: 'approved',
  },
  {
    id: 6,
    project: 'Backend API v2', projectColor: '#2a5fa8',
    description: 'Database schema migration',
    date: '2026-02-21', startTime: '10:00', endTime: '13:30',
    duration: '3h 30m', status: 'approved',
  },
  {
    id: 7,
    project: 'Mobile App', projectColor: '#2a7a4f',
    description: 'Onboarding screen UI implementation',
    date: '2026-02-21', startTime: '14:00', endTime: '17:00',
    duration: '3h 00m', status: 'approved',
  },
]