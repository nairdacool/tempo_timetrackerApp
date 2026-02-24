import { useState } from 'react'
import type { Page } from './types'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Projects from './pages/Projects'
import Reports from './pages/Reports'
import Approvals from './pages/Approvals'
import Team from './pages/Team'

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  // pages must be INSIDE the function so it can access setCurrentPage
  const pages: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard onNavigate={setCurrentPage} />,
    timesheet: <Timesheet />,
    projects:  <Projects />,
    reports:   <Reports />,
    approvals: <Approvals />,
    team:      <Team />,
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {pages[currentPage]}
    </Layout>
  )
}