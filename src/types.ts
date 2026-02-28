export type Page = 'dashboard' | 'timesheet' | 'projects' | 'reports' | 'approvals' | 'team'

export type EntryStatus = 'approved' | 'pending' | 'draft'

export interface TimeEntry {
  id: string
  project: string
  projectColor: string
  projectId: string // added projectId for easier editing
  description: string
  date: string        // 'YYYY-MM-DD'
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
  duration: string    // calculated, e.g. '2h 30m'
  status: EntryStatus
}

export interface TeamMember {
  initials: string
  color: string
}

export interface Project {
  id: number
  name: string
  client: string
  color: string
  loggedHours: number
  budgetHours: number
  status: 'active' | 'on-hold' | 'completed'
  team: TeamMember[]
}

export type ReportPeriod = 'this-month' | 'last-month' | 'q1' | 'custom'

export interface WeekBar {
  label: string
  hours: number
}

export interface ProjectSummary {
  name: string
  client: string
  color: string
  hours: number
  budgetHours: number
  billable: boolean
  status: 'active' | 'on-hold' | 'completed'
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Approval {
  id: string
  userName: string
  userInitials: string
  userColor: string
  userRole: string
  weekLabel: string
  totalHours: number
  projects: string[]
  entryCount: number
  submittedDate: string
  status: ApprovalStatus
}

export type MemberRole = 'Admin' | 'Developer' | 'Designer' | 'Engineer'
export type MemberStatus = 'active' | 'offline' | 'pending-invite'

export interface Member {
  id: number
  name: string
  initials: string
  role: MemberRole
  color: string
  status: MemberStatus
  weekHours: number
  monthHours: number
  projectCount: number
  email: string
}