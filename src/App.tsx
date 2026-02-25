import { useState } from 'react'
import type { Page } from './types'
import type { Approval } from './types'
import { mockApprovals } from './data/approvalsData'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [approvals, setApprovals] = useState<Approval[]>(mockApprovals)

  const pendingCount = approvals.filter(a => a.status === 'pending').length

  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setCurrentPage} />,
    timesheet: <Timesheet />,
    projects:  <Projects />,
    reports:   <Reports />,
    approvals: <Approvals approvals={approvals} onUpdate={setApprovals} />,
    team:      <Team />,
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} pendingCount={pendingCount}>
      {pages[currentPage]}
    </Layout>
  )
}