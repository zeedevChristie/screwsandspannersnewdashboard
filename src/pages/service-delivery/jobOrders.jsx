import React, { useMemo, useState, useEffect } from 'react'

/* Utilities */
const uid = (p = '') => `${p}${Math.random().toString(36).slice(2, 9)}`

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  return dt.toISOString().slice(0, 10)
}

function downloadCSV(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')].concat(
    rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* Mock job orders */
const initialJobs = [
  { id: uid('job-'), sr: 'SR-010', jo: 'JO-2025-006', description: 'Makeup for event', customer: 'Alice Smith', provider: 'Beauty Diva Fashions', category: 'Beauty', quote: '₦85,000', advance: '₦20,000', workmanship: '₦10,000', startDate: '2025-05-05', duration: '3 hours', status: 'Pending', location: 'Lagos' },
  { id: uid('job-'), sr: 'SR-011', jo: 'JO-2025-007', description: 'Tailor wedding gown', customer: 'John Doe', provider: 'Stitch Pro', category: 'Fashion', quote: '₦120,000', advance: '₦50,000', workmanship: '₦25,000', startDate: '2025-05-08', duration: '6 hours', status: 'Negotiating', location: 'Ikeja' },
  { id: uid('job-'), sr: 'SR-012', jo: 'JO-2025-008', description: 'Fix leaking sink', customer: 'Mary Jane', provider: 'Flow Fixers', category: 'Plumbing', quote: '₦15,000', advance: '₦5,000', workmanship: '₦3,000', startDate: '2025-04-30', duration: '1 hour', status: 'Completed', location: 'Victoria Island' },
  { id: uid('job-'), sr: 'SR-013', jo: 'JO-2025-009', description: 'Catering for 50 guests', customer: 'Event Co', provider: 'Taste Catering', category: 'Catering', quote: '₦300,000', advance: '₦100,000', workmanship: '₦50,000', startDate: '2025-06-01', duration: '5 hours', status: 'Deal', location: 'Lekki' },
  { id: uid('job-'), sr: 'SR-014', jo: 'JO-2024-101', description: 'Fashion shoot styling', customer: 'Studio One', provider: 'Beauty Diva Fashions', category: 'Fashion', quote: '₦60,000', advance: '₦10,000', workmanship: '₦5,000', startDate: '2024-12-10', duration: '4 hours', status: '100%', location: 'Ikoyi' },
  { id: uid('job-'), sr: 'SR-015', jo: 'JO-2025-010', description: 'Aircon servicing', customer: 'Paul', provider: 'CoolTech', category: 'Maintenance', quote: '₦40,000', advance: '₦0', workmanship: '₦10,000', startDate: '2025-05-03', duration: '2 hours', status: 'Pending', location: 'Lekki' },
  { id: uid('job-'), sr: 'SR-016', jo: 'JO-2025-011', description: 'Ceremony backup generator', customer: 'Green Events', provider: 'PowerPros', category: 'Events', quote: '₦150,000', advance: '₦50,000', workmanship: '₦20,000', startDate: '2025-05-20', duration: '8 hours', status: 'Cancel', location: 'Ikeja' },
  { id: uid('job-'), sr: 'SR-017', jo: 'JO-2025-012', description: 'Design party decor', customer: 'Bella', provider: 'Decor Masters', category: 'Events', quote: '₦75,000', advance: '₦25,000', workmanship: '₦10,000', startDate: '2025-05-15', duration: '5 hours', status: 'Dispute', location: 'Lagos' }
]

const categories = ['All', 'Beauty', 'Fashion', 'Plumbing', 'Catering', 'Maintenance', 'Events']
const statuses = ['All', 'Pending', 'Negotiating', 'Completed', 'Deal', '100%', 'Cancel', 'Dispute']
const locations = ['All', 'Lagos', 'Ikeja', 'Lekki', 'Victoria Island', 'Ikoyi']

export default function JobOrders() {
  const [jobs, setJobs] = useState(initialJobs)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    setPage(1)
  }, [query, categoryFilter, statusFilter, locationFilter, dateFrom, dateTo])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobs.filter(j => {
      if (categoryFilter !== 'All' && j.category !== categoryFilter) return false
      if (statusFilter !== 'All' && j.status !== statusFilter) return false
      if (locationFilter !== 'All' && j.location !== locationFilter) return false
      if (dateFrom) {
        if (new Date(j.startDate) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23,59,59,999)
        if (new Date(j.startDate) > end) return false
      }
      if (!q) return true
      const fields = [j.sr, j.jo, j.description, j.customer, j.provider, j.category, j.location].join(' ').toLowerCase()
      return fields.includes(q)
    })
  }, [jobs, query, categoryFilter, statusFilter, locationFilter, dateFrom, dateTo])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const display = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllOnPage() {
    const ids = display.map(d => d.id)
    setSelected(prev => {
      const next = new Set(prev)
      const allSelected = ids.every(id => next.has(id))
      if (allSelected) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  function bulkAction(action) {
    const ids = Array.from(selected)
    if (!ids.length) return alert('No orders selected')
    setJobs(prev => prev.map(j => ids.includes(j.id) ? { ...j, status: action } : j))
    setSelected(new Set())
  }

  function changeStatus(id, status) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  function exportView() {
    const rows = filtered.map(r => ({
      sr: r.sr,
      jo: r.jo,
      description: r.description,
      customer: r.customer,
      provider: r.provider,
      category: r.category,
      quote: r.quote,
      advance: r.advance,
      workmanship: r.workmanship,
      startDate: formatDate(r.startDate),
      duration: r.duration,
      status: r.status,
      location: r.location
    }))
    downloadCSV('job-orders.csv', rows)
  }

  // function addMockJob() {
  //   const newJob = { id: uid('job-'), sr: `SR-${Math.floor(Math.random()*900 + 100)}`, jo: `JO-${Date.now()}`, description: 'New job order', customer: 'New Customer', provider: 'New Provider', category: 'Maintenance', quote: '₦10,000', advance: '₦0', workmanship: '₦0', startDate: formatDate(new Date()), duration: '2 hours', status: 'Pending', location: 'Lagos' }
  //   setJobs(prev => [newJob, ...prev])
  // }

  function deleteJob(id) {
    if (!confirm('Delete this job order?')) return
    setJobs(prev => prev.filter(j => j.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  return (
    <div className="">
      <div className="p- border-b">
        <h1 className="text-2xl font-semibold">Job Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage service requests and job orders</p>

        <div className="flex">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search SR, JO, description, customer, provider"
            className="border rounded px- py-"
          />
          <div className="flex space-x-">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-3 py-2">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items- space-x-">
            <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="border rounded px-3 py-2">
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded px-3 py-2" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded px-3 py-2" />
            <button className="bg-gray-100 px-3 py-2 rounded" onClick={() => { setDateFrom(''); setDateTo('') }}>Clear</button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {/* <div className="flex items-center space-x-2">
            <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={exportView}>Export Details</button>
            <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={addMockJob}>Add Mock Job</button>
          </div> */}
          <div className="text-sm text-gray-600">Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input type="checkbox" checked={display.length>0 && display.every(d => selected.has(d.id))} onChange={toggleSelectAllOnPage} />
            <button onClick={() => bulkAction('Completed')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Bulk Complete</button>
            <button onClick={() => bulkAction('Cancel')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Bulk Cancel</button>
            <button onClick={() => bulkAction('Negotiating')} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Bulk Negotiate</button>
            <div className="text-sm text-gray-600">Selected {selected.size}</div>
          </div>

          <div className="text-sm text-gray-600">
            Page size:
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="ml-2 border rounded px-2 py-1">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
      </div>

<div className="overflow-x-auto p-4">
  <table className="min-w-full table-fixed" style={{ tableLayout: 'fixed' }}>
    <thead className="bg-gray-50 text-left">
      <tr>
        <th className="px-3 py-2 w-10"> </th>
        <th className="px-3 py-2 w-36 min-w-[140px]">Service Request ID</th>
        <th className="px-3 py-2 w-40 min-w-[160px]">Job ID</th>
        <th className="px-3 py-2 w-96 min-w-[320px]">Description</th>
        <th className="px-3 py-2 w-44 min-w-[180px]">Customer</th>
        <th className="px-3 py-2 w-56 min-w-[220px]">Service Provider</th>
        <th className="px-3 py-2 w-36 min-w-[140px]">Category</th>
        <th className="px-3 py-2 w-36 min-w-[140px]">Quote</th>
        <th className="px-3 py-2 w-36 min-w-[140px]">Advance</th>
        <th className="px-3 py-2 w-36 min-w-[140px]">Workmanship</th>
        <th className="px-3 py-2 w-40 min-w-[160px]">Start Date</th>
        <th className="px-3 py-2 w-32 min-w-[120px]">Duration</th>
        <th className="px-3 py-2 w-40 min-w-[160px]">Status</th>
        <th className="px-3 py-2 w-56 min-w-[220px]">Actions</th>
      </tr>
    </thead>
    <tbody>
      {display.length === 0 && (
        <tr><td colSpan="14" className="px-4 py-6 text-center text-gray-500">No orders found.</td></tr>
      )}
      {display.map(row => (
        <tr key={row.id} className="border-t">
          <td className="px-3 py-2 w-10">
            <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
          </td>
          <td className="px-3 py-2 w-36 min-w-[140px] truncate">{row.sr}</td>
          <td className="px-3 py-2 w-40 min-w-[160px] truncate">{row.jo}</td>
          <td className="px-3 py-2 w-96 min-w-[320px] truncate">{row.description}</td>
          <td className="px-3 py-2 w-44 min-w-[180px] truncate">{row.customer}</td>
          <td className="px-3 py-2 w-56 min-w-[220px] truncate">{row.provider}</td>
          <td className="px-3 py-2 w-36 min-w-[140px] truncate">{row.category}</td>
          <td className="px-3 py-2 w-36 min-w-[140px] truncate">{row.quote}</td>
          <td className="px-3 py-2 w-36 min-w-[140px] truncate">{row.advance}</td>
          <td className="px-3 py-2 w-36 min-w-[140px] truncate">{row.workmanship}</td>
          <td className="px-3 py-2 w-40 min-w-[160px] truncate">{formatDate(row.startDate)}</td>
          <td className="px-3 py-2 w-32 min-w-[120px] truncate">{row.duration}</td>
          <td className="px-3 py-2 w-40 min-w-[160px]">
            <span className={
              row.status === 'Completed' ? 'text-green-700' :
              row.status === 'Cancel' ? 'text-red-700' :
              row.status === 'Negotiating' ? 'text-yellow-700' :
              row.status === 'Deal' ? 'text-blue-700' : 'text-gray-700'
            }>{row.status}</span>
          </td>
          <td className="px-3 py-2 w-56 min-w-[220px]">
            <div className="flex items-center space-x-2">
              <button onClick={() => setDetail(row)} className="px-2 py-1 border rounded text-sm">View</button>
              <div className="relative inline-block">
                <select value={row.status} onChange={e => changeStatus(row.id, e.target.value)} className="px-2 py-1 border rounded text-sm">
                  {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => deleteJob(row.id)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      <div className="p-4 flex items-center justify-between border-t">
        <div className="flex items-center space-x-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Prev</button>
          <div>Page {page} / {pages}</div>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded">Next</button>
        </div>

        <div className="text-sm text-gray-600">Showing {display.length} of {filtered.length} filtered</div>
      </div>

      {/* Detail drawer/modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg w-full max-w-2xl p-4 m-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Order details</h3>
                <p className="text-sm text-gray-500">SR: {detail.sr} • JO: {detail.jo}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => setDetail(null)} className="px-3 py-1 border rounded">Close</button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><strong>Customer</strong><div>{detail.customer}</div></div>
              <div><strong>Provider</strong><div>{detail.provider}</div></div>
              <div><strong>Category</strong><div>{detail.category}</div></div>
              <div><strong>Location</strong><div>{detail.location}</div></div>
              <div><strong>Start Date</strong><div>{formatDate(detail.startDate)}</div></div>
              <div><strong>Duration</strong><div>{detail.duration}</div></div>
              <div className="col-span-2"><strong>Description</strong><div>{detail.description}</div></div>
              <div><strong>Quote</strong><div>{detail.quote}</div></div>
              <div><strong>Advance</strong><div>{detail.advance}</div></div>
              <div><strong>Workmanship</strong><div>{detail.workmanship}</div></div>
              <div><strong>Status</strong><div>{detail.status}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
