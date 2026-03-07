// @ts-ignore – Vite raw import
import manualHtml from '../../public/admin-manual.html?raw'
import { useBreakpoint } from '../hooks/useBreakpoint'

export default function HelpCenter() {
  const { isMobile } = useBreakpoint()

  return (
    <div style={{
      height: isMobile ? 'calc(100vh - 64px)' : '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <iframe
        title="Help Center"
        srcDoc={manualHtml}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
        }}
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>
  )
}
