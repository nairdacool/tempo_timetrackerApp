import type { WeekBar, ProjectSummary } from '../types'

export const weekBars: Record<string, WeekBar[]> = {
  'this-month': [
    { label: 'W1', hours: 34 },
    { label: 'W2', hours: 41 },
    { label: 'W3', hours: 38 },
    { label: 'W4', hours: 28 },
  ],
  'last-month': [
    { label: 'W1', hours: 28 },
    { label: 'W2', hours: 35 },
    { label: 'W3', hours: 40 },
    { label: 'W4', hours: 37 },
  ],
  'q1': [
    { label: 'Jan W1', hours: 32 },
    { label: 'Jan W2', hours: 38 },
    { label: 'Jan W3', hours: 35 },
    { label: 'Jan W4', hours: 29 },
    { label: 'Feb W1', hours: 34 },
    { label: 'Feb W2', hours: 41 },
    { label: 'Feb W3', hours: 38 },
    { label: 'Feb W4', hours: 28 },
  ],
  'custom': [
  { label: 'W1', hours: 0 },
  { label: 'W2', hours: 0 },
  { label: 'W3', hours: 0 },
  { label: 'W4', hours: 0 },
],
}

export const projectSummaries: Record<string, ProjectSummary[]> = {
  'this-month': [
    { name: 'Acme Website Redesign', client: 'Acme Corp',    color: '#c8602a', hours: 48,  budgetHours: 80,  billable: true,  status: 'active'   },
    { name: 'Backend API v2',        client: 'Internal',     color: '#2a5fa8', hours: 32,  budgetHours: 120, billable: false, status: 'active'   },
    { name: 'Mobile App',            client: 'TechStart',    color: '#2a7a4f', hours: 32,  budgetHours: 200, billable: true,  status: 'active'   },
    { name: 'Data Pipeline',         client: 'Internal',     color: '#c87d2a', hours: 16,  budgetHours: 60,  billable: false, status: 'on-hold'  },
  ],
  'last-month': [
    { name: 'Acme Website Redesign', client: 'Acme Corp',    color: '#c8602a', hours: 40,  budgetHours: 80,  billable: true,  status: 'active'   },
    { name: 'Backend API v2',        client: 'Internal',     color: '#2a5fa8', hours: 28,  budgetHours: 120, billable: false, status: 'active'   },
    { name: 'Mobile App',            client: 'TechStart',    color: '#2a7a4f', hours: 52,  budgetHours: 200, billable: true,  status: 'active'   },
    { name: 'Data Pipeline',         client: 'Internal',     color: '#c87d2a', hours: 20,  budgetHours: 60,  billable: false, status: 'on-hold'  },
  ],
  'q1': [
    { name: 'Acme Website Redesign', client: 'Acme Corp',    color: '#c8602a', hours: 88,  budgetHours: 80,  billable: true,  status: 'active'   },
    { name: 'Backend API v2',        client: 'Internal',     color: '#2a5fa8', hours: 60,  budgetHours: 120, billable: false, status: 'active'   },
    { name: 'Mobile App',            client: 'TechStart',    color: '#2a7a4f', hours: 84,  budgetHours: 200, billable: true,  status: 'active'   },
    { name: 'Data Pipeline',         client: 'Internal',     color: '#c87d2a', hours: 36,  budgetHours: 60,  billable: false, status: 'on-hold'  },
    { name: 'Design System',         client: 'Internal',     color: '#7a4fa8', hours: 24,  budgetHours: 40,  billable: false, status: 'active'   },
  ],
  'custom': [],
}

export const periodLabels: Record<string, string> = {
  'this-month': 'February 2026',
  'last-month': 'January 2026',
  'q1':         'Q1 2026',
  'custom': 'Custom Range',
}