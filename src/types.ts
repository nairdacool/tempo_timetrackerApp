export type Page = 'dashboard' | 'timesheet' | 'projects' | 'reports' | 'approvals' | 'team'

export type EntryStatus = 'approved' | 'pending' | 'draft'

export interface TimeEntry {
  id: number
  project: string
  projectColor: string
  description: string
  date: string        // 'YYYY-MM-DD'
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  duration: string    // calculated, e.g. '2h 30m'
  status: EntryStatus
}