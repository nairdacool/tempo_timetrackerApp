export type Page = 'dashboard' | 'timesheet' | 'projects' | 'reports' | 'approvals' | 'team' | 'organizations'

export interface Organization {
  id:        string
  name:      string
  createdAt: string
  members:   { id: string; name: string; initials: string; color: string; role: string; email: string }[]
  projects:  { id: string; name: string; color: string; status: string }[]
}

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
  id: string
  name: string
  client: string
  color: string
  loggedHours: number
  budgetHours: number
  billable: boolean
  status: 'active' | 'on-hold' | 'completed' | 'archived'
  team: TeamMember[]
  organizationId?: string
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
  status: 'active' | 'on-hold' | 'completed' | 'archived'
}

export interface MemberSummary {
  memberId:     string
  name:         string
  initials:     string
  color:        string
  hours:        number
  projectCount: number
}

export interface DetailEntry {
  date:        string
  member:      string
  project:     string
  description: string
  hours:       number
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Approval {
  id:            string
  userName:      string
  userInitials:  string
  userColor:     string
  userRole:      string
  weekLabel:     string
  weekStart:     string
  weekEnd:       string
  userId:        string
  totalHours:    number
  projects:      { name: string; color: string; hours: number }[]  // ← change this
  entryCount:    number
  submittedDate: string
  status:           ApprovalStatus
  rejectionReason?: string
}

export type MemberRole = 'Admin' | 'Developer' | 'Designer' | 'Other' | string
export type MemberStatus = 'active' | 'offline' | 'pending-invite'
export interface Member {
  id:             string
  name:           string
  initials:       string
  color:          string
  role:           string
  email:          string
  status:         MemberStatus
  isActive:       boolean
  weekHours:      number
  monthHours:     number
  projects:       number
  lastSeen:       string | null
  organizationId?: string
}