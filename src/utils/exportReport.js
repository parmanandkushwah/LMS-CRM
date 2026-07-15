import * as XLSX from 'xlsx'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const toRows = (headers, rows) => [headers, ...rows]

export function exportReportsToExcel(view, data, { filename } = {}) {
  const wb = XLSX.utils.book_new()
  const leads = data?.leads || []
  const invoices = data?.revenue?.invoices || []
  const agents = data?.agents || []

  const addSheet = (name, headers, rows) => {
    const ws = XLSX.utils.aoa_to_sheet(toRows(headers, rows))
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(12, String(h).length + 2) }))
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  }

  // Summary
  addSheet('Summary', ['Metric', 'Value'], view.kpis.map((k) => [k.title, k.value]))

  // Revenue Trend (matches the page's area chart: revenue + paid)
  addSheet(
    'Revenue Trend',
    ['Month', 'Revenue', 'Paid'],
    view.monthlyRev.map((m) => [m.month, num(m.revenue), num(m.paid)])
  )

  // Monthly Breakdown
  const monthlyRows = view.table.map((row, i) => {
    const prev = view.table[i - 1]
    const growth = prev && prev.revenue ? Math.round(((row.revenue - prev.revenue) / prev.revenue) * 100) : 0
    return [row.month, num(row.revenue), num(row.leads), num(row.deals), num(row.avg), growth]
  })
  addSheet('Monthly Breakdown', ['Month', 'Revenue', 'Leads', 'Deals', 'Avg Deal Size', 'Growth %'], monthlyRows)

  // Lead Sources
  addSheet(
    'Lead Sources',
    ['Source', 'Leads', 'Share %'],
    (view.leadSources || []).map((s) => [s.name, num(s.raw), num(s.value)])
  )

  // Conversion Funnel
  addSheet(
    'Conversion Funnel',
    ['Stage', 'Count', 'Percentage %'],
    (view.conversion || []).map((c) => [c.stage, num(c.count), num(c.pct)])
  )

  // Employee Performance
  addSheet(
    'Employee Performance',
    ['Agent', 'Email', 'Total Leads', 'Deals Won', 'Lost', 'Activities', 'Win Rate %'],
    agents.map((a) => [
      a.agent?.name || '',
      a.agent?.email || '',
      num(a.total),
      num(a.won),
      num(a.lost),
      num(a.activities),
      num(a.winRate),
    ])
  )

  // Recent Leads
  addSheet(
    'Recent Leads',
    ['Title', 'Contact', 'Company', 'Status', 'Source', 'Priority', 'Assigned To', 'Estimated Value', 'Created At'],
    leads.map((l) => [
      l.title || '',
      l.contact_name || '',
      l.company_name || '',
      l.status || '',
      l.source || '',
      l.priority || '',
      l.assignee?.name || '',
      num(l.estimated_value),
      l.createdAt || l.created_at || '',
    ])
  )

  // Invoices
  addSheet(
    'Invoices',
    ['Invoice #', 'Title', 'Lead', 'Contact', 'Issue Date', 'Due Date', 'Status', 'Total', 'Paid', 'Balance'],
    invoices.map((inv) => [
      inv.invoice_number || '',
      inv.title || '',
      inv.lead?.title || '',
      inv.lead?.contact_name || '',
      inv.issue_date || '',
      inv.due_date || '',
      inv.status || '',
      num(inv.total),
      num(inv.paid_amount),
      num(inv.balance_due),
    ])
  )

  const name = filename || `LMS_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, name)
}

export function exportSheetToExcel(sheetName, headers, rows, { filename } = {}) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(12, String(h).length + 2) }))
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  const name = filename || `${sheetName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, name)
}
