import React, { useMemo, useState, useEffect } from 'react'

/* Utilities */
function formatDateISO(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  return dt.toISOString().slice(0, 10)
}
function humanDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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

/* Mock data (transcribed from provided table) */
const initialStats = [
  { sn: 2, period: '2025-05-06', category: 'Beauty', city: 'Lagos', totalSearch: 150, totalRequest: 80, totalJobOrders: 10, ratio: '8:1:4' },
  { sn: 3, period: '2025-05-07', category: 'Fashion', city: 'Abuja', totalSearch: 200, totalRequest: 120, totalJobOrders: 16, ratio: '9:2:5' },
  { sn: 4, period: '2025-05-08', category: 'Plumbing', city: 'Port Harcourt', totalSearch: 340, totalRequest: 100, totalJobOrders: 20, ratio: '10:3:6' },
  { sn: 5, period: '2025-05-09', category: 'Catering', city: 'Ibadan', totalSearch: 560, totalRequest: 20, totalJobOrders: 16, ratio: '11:4:7' },
  { sn: 6, period: '2025-05-10', category: 'Catering', city: 'Kano', totalSearch: 620, totalRequest: 50, totalJobOrders: 23, ratio: '12:5:8' },
  { sn: 7, period: '2025-05-11', category: 'Fashion', city: 'Benin City', totalSearch: 740, totalRequest: 120, totalJobOrders: 56, ratio: '13:6:9' },
  { sn: 8, period: '2025-05-12', category: 'Fashion', city: 'Enugu', totalSearch: 850, totalRequest: 240, totalJobOrders: 123, ratio: '14:7:10' },
  { sn: 9, period: '2025-05-13', category: 'Fashion', city: 'Kaduna', totalSearch: 990, totalRequest: 350, totalJobOrders: 120, ratio: '15:8:11' },
  { sn: 10, period: '2025-05-14', category: 'Fashion', city: 'Aba', totalSearch: 1200, totalRequest: 500, totalJobOrders: 320, ratio: '16:9:12' },
  { sn: 11, period: '2025-05-15', category: 'Catering', city: 'Jos', totalSearch: 1450, totalRequest: 321, totalJobOrders: 156, ratio: '17:10:13' }
]

const categories = ['All', 'Beauty', 'Fashion', 'Plumbing', 'Catering']
const cities = ['All', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Benin City', 'Enugu', 'Kaduna', 'Aba', 'Jos']

export default function SearchStatistics() {
  const [rows, setRows] = useState(initialStats)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { setPage(1) }, [query, categoryFilter, cityFilter, dateFrom, dateTo])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(r => {
      if (categoryFilter !== 'All' && r.category !== categoryFilter) return false
      if (cityFilter !== 'All' && r.city !== cityFilter) return false
      if (dateFrom) {
        if (new Date(r.period) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23,59,59,999)
        if (new Date(r.period) > end) return false
      }
      if (!q) return true
      const hay = [String(r.sn), r.period, r.category, r.city, String(r.totalSearch), String(r.totalRequest), String(r.totalJobOrders), r.ratio].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rows, query, categoryFilter, cityFilter, dateFrom, dateTo])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const display = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  function exportView() {
    const exportRows = filtered.map(r => ({
      'S/N': r.sn,
      Period: humanDate(r.period),
      Category: r.category,
      'City/Town': r.city,
      'Total Search': r.totalSearch,
      'Total Request': r.totalRequest,
      'Total Job Orders': r.totalJobOrders,
      'S:SR:JO': r.ratio
    }))
    downloadCSV('search-statistics.csv', exportRows)
  }

  return (
    <div className="">
      <div className="p- border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Search Statistics</h1>
            <p className="text-sm text-gray-500 mt-1">View and export search activity statistics</p>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={exportView} className="bg-green-600 text-white px-3 py-2 rounded">Export Details</button>
          </div>
        </div>

        <div className="flex mt-2">
          <input className="border rounded px-3 py-2" placeholder="Search period, category, city, numbers..." value={query} onChange={e => setQuery(e.target.value)} />

          <div className="flex space-x-2">
            <select className="border rounded px-3 py-2" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="border rounded px-3 py-2" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input type="date" className="border rounded px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span className="text-gray-500">to</span>
            <input type="date" className="border rounded px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            <button onClick={() => { setDateFrom(''); setDateTo('') }} className="ml-2 bg-gray-100 px-3 py-2 rounded">Clear</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="min-w-full table-fixed">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2 w-12">S/N</th>
              <th className="px-3 py-2 w-36">Period</th>
              <th className="px-3 py-2 w-36">Category</th>
              <th className="px-3 py-2 w-48">City/Town</th>
              <th className="px-3 py-2 w-36">Total Search</th>
              <th className="px-3 py-2 w-36">Total Request</th>
              <th className="px-3 py-2 w-40">Total Job Orders</th>
              <th className="px-3 py-2 w-36">S:SR:JO</th>
            </tr>
          </thead>

          <tbody>
            {display.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-6 text-center text-gray-500">No results found.</td></tr>
            )}

            {display.map(row => (
              <tr key={row.sn} className="border-t">
                <td className="px-3 py-2 w-12">{row.sn}</td>
                <td className="px-3 py-2 w-36">{humanDate(row.period)}</td>
                <td className="px-3 py-2 w-36">{row.category}</td>
                <td className="px-3 py-2 w-48">{row.city}</td>
                <td className="px-3 py-2 w-36">{row.totalSearch}</td>
                <td className="px-3 py-2 w-36">{row.totalRequest}</td>
                <td className="px-3 py-2 w-40">{row.totalJobOrders}</td>
                <td className="px-3 py-2 w-36">{row.ratio}</td>
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

        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">Showing {display.length} of {filtered.length}</div>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="border rounded px-2 py-1">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
    </div>
  )
}
