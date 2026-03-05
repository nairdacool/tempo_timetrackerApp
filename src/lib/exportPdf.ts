import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { WeekBar, ProjectSummary, MemberSummary, DetailEntry } from '../types'

// jspdf-autotable augments the jsPDF instance at runtime
type JsPDFWithAutoTable = jsPDF & { lastAutoTable: { finalY: number } }

interface ReportPdfOptions {
  periodLabel:     string
  totalHours:      number
  billableHours:   number
  billablePct:     number
  bars:            WeekBar[]
  summaries:       ProjectSummary[]
  memberSummaries: MemberSummary[]
  detailEntries:   DetailEntry[]
}

// Dark theme palette → muted equivalents that print cleanly on white
const ACCENT   = [232, 110, 50]  as [number,number,number]  // #e86e32 orange
const DARK     = [30,  30,  34]  as [number,number,number]  // near-black
const MID      = [100, 100, 110] as [number,number,number]  // muted text
const LIGHT    = [245, 245, 248] as [number,number,number]  // row stripes
const WHITE    = [255, 255, 255] as [number,number,number]
const BORDER   = [220, 220, 226] as [number,number,number]
const RED      = [192,  48,  48] as [number,number,number]  // over-budget
const RED_LIGHT= [253, 232, 232] as [number,number,number]
const GREEN    = [ 34, 160,  80] as [number,number,number]  // healthy budget

export function downloadPdf(opts: ReportPdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  let y = margin

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text('Tempo', margin, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 190)
  doc.text('Time Tracking Report', margin + 26, 13)

  const genDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  doc.text(`Generated ${genDate}`, pageW - margin, 13, { align: 'right' })

  y = 30

  // ── Period title ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...DARK)
  doc.text(opts.periodLabel, margin, y)
  y += 10

  // ── Stat pills ──────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Hours',    value: `${opts.totalHours}h` },
    { label: 'Billable Hours', value: `${opts.billableHours}h` },
    { label: 'Billable %',     value: `${opts.billablePct}%` },
    { label: 'Projects',       value: `${opts.summaries.length}` },
  ]

  const pillW = (pageW - margin * 2 - 9) / 4
  stats.forEach((stat, i) => {
    const x = margin + i * (pillW + 3)
    doc.setFillColor(...LIGHT)
    doc.roundedRect(x, y, pillW, 16, 3, 3, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...ACCENT)
    doc.text(stat.value, x + pillW / 2, y + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MID)
    doc.text(stat.label, x + pillW / 2, y + 13, { align: 'center' })
  })
  y += 24

  // ── Weekly hours bar chart ───────────────────────────────────────────────────
  if (opts.bars.length > 0) {
    sectionHeader(doc, 'Hours by Week', margin, y)
    y += 8

    const chartH   = 42
    const chartW   = pageW - margin * 2
    const maxHours = Math.max(...opts.bars.map(b => b.hours), 1)
    const barCount = opts.bars.length
    const slotW    = chartW / barCount
    const barW     = Math.min(slotW * 0.55, 14)

    // Grid lines + y-axis labels
    const gridSteps = 4
    for (let g = 0; g <= gridSteps; g++) {
      const gy    = y + chartH - (g / gridSteps) * chartH
      const ghVal = Math.round((maxHours * g) / gridSteps * 10) / 10
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.line(margin + 8, gy, margin + chartW, gy)
      doc.setFontSize(6)
      doc.setTextColor(...MID)
      doc.text(`${ghVal}h`, margin + 6, gy + 1, { align: 'right' })
    }

    // Bars
    opts.bars.forEach((bar, i) => {
      const barH  = bar.hours > 0 ? Math.max((bar.hours / maxHours) * chartH, 1.5) : 0
      const bx    = margin + 8 + i * slotW + (slotW - barW) / 2
      const by    = y + chartH - barH

      // Bar fill
      doc.setFillColor(...ACCENT)
      doc.roundedRect(bx, by, barW, barH, 1, 1, 'F')

      // Value label above bar
      if (bar.hours > 0) {
        doc.setFontSize(6)
        doc.setTextColor(...DARK)
        doc.text(`${bar.hours}h`, bx + barW / 2, by - 1, { align: 'center' })
      }

      // X-axis label
      doc.setFontSize(6)
      doc.setTextColor(...MID)
      doc.text(bar.label, bx + barW / 2, y + chartH + 5, { align: 'center' })
    })

    y += chartH + 12
  }

  // ── Over-budget callout ─────────────────────────────────────────────────────
  const overBudget = opts.summaries.filter(
    p => p.budgetHours > 0 && p.hours > p.budgetHours
  )
  if (overBudget.length > 0) {
    if (y > 230) { doc.addPage(); y = margin }

    doc.setFillColor(...RED_LIGHT)
    doc.setDrawColor(...RED)
    doc.setLineWidth(0.4)
    const calloutH = 8 + overBudget.length * 6
    doc.roundedRect(margin, y, pageW - margin * 2, calloutH, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...RED)
    doc.text('⚠  Over-budget Projects', margin + 4, y + 6)

    overBudget.forEach((p, i) => {
      const pct = Math.round((p.hours / p.budgetHours) * 100)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(...RED)
      doc.text(
        `${p.name}  —  ${p.hours}h logged / ${p.budgetHours}h budget  (${pct}%)`,
        margin + 6,
        y + 12 + i * 6,
      )
    })

    y += calloutH + 8
  }

  // ── Project breakdown table ─────────────────────────────────────────────────
  sectionHeader(doc, 'Project Breakdown', margin, y)
  y += 7

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Project', 'Client', 'Hours', 'Budget', 'Utilization', 'Status']],
    body: opts.summaries.map(p => [
      p.name,
      p.client || '—',
      `${p.hours}h`,
      p.budgetHours ? `${p.budgetHours}h` : '—',
      // Leave empty — we draw the % label + bar manually in didDrawCell
      p.budgetHours ? '' : '—',
      p.status,
    ]),
    headStyles:         { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT },
    bodyStyles:         { fontSize: 8.5, textColor: DARK, minCellHeight: 10 },
    columnStyles: {
      2: { halign: 'right', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 16 },
      4: { cellWidth: 38 },
    },
    tableLineColor: BORDER,
    tableLineWidth: 0.2,
    didDrawCell: (data) => {
      const p = opts.summaries[data.row.index]
      if (!p || data.section !== 'body' || data.column.index !== 4) return
      if (!p.budgetHours) return

      const isOver  = p.hours > p.budgetHours
      const pct     = Math.round((p.hours / p.budgetHours) * 100)
      const fill    = Math.min(p.hours / p.budgetHours, 1)
      const color   = isOver ? RED : GREEN

      const cellX   = data.cell.x + 2
      const cellY   = data.cell.y
      const cellH   = data.cell.height
      const inner   = data.cell.width - 4

      // % label — left-aligned, vertically centred in upper half
      const labelW  = 12
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(...color)
      doc.text(`${pct}%`, cellX, cellY + cellH / 2, { baseline: 'middle' })

      // Bar track — fills remaining width to the right of the label
      const trackX  = cellX + labelW
      const trackW  = inner - labelW
      const trackH  = 3
      const trackY  = cellY + (cellH - trackH) / 2

      doc.setFillColor(...BORDER)
      doc.roundedRect(trackX, trackY, trackW, trackH, 1, 1, 'F')

      // Bar fill
      const fillW = Math.max(trackW * fill, fill > 0 ? 1.5 : 0)
      doc.setFillColor(...color)
      doc.roundedRect(trackX, trackY, fillW, trackH, 1, 1, 'F')
    },
    willDrawCell: (data) => {
      if (data.section !== 'body') return
      const p = opts.summaries[data.row.index]
      if (p && p.budgetHours > 0 && p.hours > p.budgetHours) {
        data.cell.styles.textColor = RED
      }
    },
  })

  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12

  // ── Client rollup ────────────────────────────────────────────────────────────
  const clientMap = new Map<string, { hours: number; projects: Set<string>; billableHours: number }>()
  opts.summaries.forEach(p => {
    const key = p.client || 'No Client'
    const cur = clientMap.get(key) ?? { hours: 0, projects: new Set<string>(), billableHours: 0 }
    cur.hours        += p.hours
    cur.billableHours += p.billable ? p.hours : 0
    cur.projects.add(p.name)
    clientMap.set(key, cur)
  })

  const clientRows = Array.from(clientMap.entries())
    .sort((a, b) => b[1].hours - a[1].hours)

  if (clientRows.length > 1) {
    if (y > 230) { doc.addPage(); y = margin }

    sectionHeader(doc, 'By Client', margin, y)
    y += 7

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Client', 'Hours', 'Projects', 'Billable %']],
      body: clientRows.map(([client, d]) => [
        client,
        `${Math.round(d.hours * 10) / 10}h`,
        d.projects.size,
        d.hours > 0 ? `${Math.round((d.billableHours / d.hours) * 100)}%` : '—',
      ]),
      headStyles:         { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      bodyStyles:         { fontSize: 8.5, textColor: DARK },
      columnStyles:       { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      tableLineColor:     BORDER,
      tableLineWidth:     0.2,
    })

    y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12
  }

  // ── Member breakdown table (if present) ─────────────────────────────────────
  if (opts.memberSummaries.length > 0) {
    // Start new page if not enough space
    if (y > 230) { doc.addPage(); y = margin }

    sectionHeader(doc, 'Member Breakdown', margin, y)
    y += 7

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Member', 'Hours', 'Projects']],
      body: opts.memberSummaries.map(m => [m.name, `${m.hours}h`, m.projectCount]),
      headStyles:         { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      bodyStyles:         { fontSize: 8.5, textColor: DARK },
      columnStyles:       { 1: { halign: 'right' }, 2: { halign: 'right' } },
      tableLineColor:     BORDER,
      tableLineWidth:     0.2,
    })

    y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 12
  }

  // ── Detail entries table ─────────────────────────────────────────────────────
  if (opts.detailEntries.length > 0) {
    if (y > 220) { doc.addPage(); y = margin }

    sectionHeader(doc, 'Time Entry Detail', margin, y)
    y += 7

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Date', 'Member', 'Project', 'Description', 'Hours']],
      body: opts.detailEntries.map(e => [
        e.date,
        e.member,
        e.project,
        e.description || '—',
        `${e.hours}h`,
      ]),
      headStyles:         { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT },
      bodyStyles:         { fontSize: 7.5, textColor: DARK },
      columnStyles:       {
        0: { cellWidth: 22 },
        4: { halign: 'right', cellWidth: 16 },
      },
      tableLineColor:  BORDER,
      tableLineWidth:  0.2,
    })
  }

  // ── Page numbers ─────────────────────────────────────────────────────────────
  const totalPages: number = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MID)
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageW - margin,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' },
    )
  }

  const filename = `report_${opts.periodLabel.replace(/[^a-z0-9]/gi, '_')}.pdf`
  doc.save(filename)
}

function sectionHeader(doc: jsPDF, title: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(title, x, y)
  doc.setDrawColor(...ACCENT)
  doc.setLineWidth(0.6)
  const pageW = doc.internal.pageSize.getWidth()
  doc.line(x, y + 2, pageW - x, y + 2)
}
