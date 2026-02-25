import type { Project } from '../types'

export const mockProjects: Project[] = [
  {
    id: 1,
    name: 'Acme Website Redesign',
    client: 'Acme Corporation',
    color: '#c8602a',
    loggedHours: 48,
    budgetHours: 80,
    status: 'active',
    team: [
      { initials: 'JD', color: '#c8602a' },
      { initials: 'MK', color: '#2a5fa8' },
      { initials: 'AR', color: '#2a7a4f' },
    ],
  },
  {
    id: 2,
    name: 'Backend API v2',
    client: 'Internal',
    color: '#2a5fa8',
    loggedHours: 32,
    budgetHours: 120,
    status: 'active',
    team: [
      { initials: 'MK', color: '#2a5fa8' },
      { initials: 'TL', color: '#c87d2a' },
    ],
  },
  {
    id: 3,
    name: 'Mobile App',
    client: 'TechStart Inc.',
    color: '#2a7a4f',
    loggedHours: 61,
    budgetHours: 200,
    status: 'active',
    team: [
      { initials: 'JD', color: '#c8602a' },
      { initials: 'AR', color: '#2a7a4f' },
      { initials: 'TL', color: '#c87d2a' },
    ],
  },
  {
    id: 4,
    name: 'Data Pipeline',
    client: 'Internal',
    color: '#c87d2a',
    loggedHours: 18,
    budgetHours: 60,
    status: 'on-hold',
    team: [
      { initials: 'TL', color: '#c87d2a' },
    ],
  },
  {
    id: 5,
    name: 'Design System',
    client: 'Internal',
    color: '#7a4fa8',
    loggedHours: 24,
    budgetHours: 40,
    status: 'active',
    team: [
      { initials: 'AR', color: '#2a7a4f' },
      { initials: 'JD', color: '#c8602a' },
    ],
  },
]