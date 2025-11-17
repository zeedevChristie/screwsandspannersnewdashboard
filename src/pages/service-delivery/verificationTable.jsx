import React, { useEffect, useMemo, useState } from 'react'

function formatDate(d) {
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

export default function VerificationTable({ data, onBulkUpdate, verificationTypes, statuses }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [selectAllOnPage, setSelectAllOnPage] = useState(false)
  const [pageSize] = useState(10)
  const [page, setPage] = useState(1)

  const [preview, setPreview] = useState(null) // { kind, value, filename? }

  useEffect(() => {
    setSelected(new Set())
    setSelectAllOnPage(false)
  }, [query, typeFilter, statusFilter, dateFrom, dateTo])

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (typeFilter !== 'All' && r.type !== typeFilter) return false
      if (statusFilter !== 'All' && r.status !== statusFilter) return false
      if (query) {
        const q = query.toLowerCase()
        const att = (typeof r.attachment === 'object' ? String(r.attachment.value) : String(r.attachment)).toLowerCase()
        if (!(r.name.toLowerCase().includes(q) || att.includes(q))) return false
      }
      if (dateFrom) {
        if (new Date(r.date) < new Date(dateFrom)) return false
      }
      if (dateTo) {
        const rowDate = new Date(r.date)
        const endDate = new Date(dateTo)
        endDate.setHours(23,59,59,999)
        if (rowDate > endDate) return false
      }
      return true
    })
  }, [data, typeFilter, statusFilter, query, dateFrom, dateTo])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  useEffect(() => { if (page > pages) setPage(1) }, [pages])

  const start = (page - 1) * pageSize
  const currentPageRows = filtered.slice(start, start + pageSize)

  useEffect(() => {
    const allIds = currentPageRows.map(r => r.id)
    const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
    setSelectAllOnPage(allSelected)
  }, [currentPageRows, selected])

  function toggleSelect(id) {
    setSelected(prev => {
      const copy = new Set(prev)
      if (copy.has(id)) copy.delete(id)
      else copy.add(id)
      return copy
    })
  }

  function toggleSelectAllOnPage() {
    setSelected(prev => {
      const copy = new Set(prev)
      const ids = currentPageRows.map(r => r.id)
      const allSelected = ids.every(id => copy.has(id))
      if (allSelected) ids.forEach(id => copy.delete(id))
      else ids.forEach(id => copy.add(id))
      return copy
    })
    setSelectAllOnPage(s => !s)
  }

  function doBulk(action) {
    const ids = Array.from(selected)
    if (!ids.length) return alert('No rows selected')
    onBulkUpdate(ids, action)
    setSelected(new Set())
  }

  function toggleRowStatus(id, action) {
    onBulkUpdate([id], action)
    setSelected(prev => {
      const copy = new Set(prev)
      copy.delete(id)
      return copy
    })
  }

  function exportView() {
    const exportRows = filtered.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      attachment: typeof r.attachment === 'object' ? (r.attachment.kind === 'text' ? r.attachment.value : r.attachment.value) : r.attachment,
      date: formatDate(r.date),
      status: r.status
    }))
    downloadCSV('verification-export.csv', exportRows)
  }

  function openPreview(att) {
    setPreview(att)
  }

  function closePreview() {
    setPreview(null)
  }

  function downloadImage(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = 'attachment'
    a.click()
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text).then(() => {
      // silent success
    }).catch(() => {})
  }

  return (
    <div className="p-">
      <div className="flex gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search name or attachment"
            className="w-full border rounded px-3 py-2"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="flex space-x-2">
          <select className="border rounded px-3 py-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All">All verification types</option>
            {verificationTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="border rounded px-3 py-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input type="date" className="border rounded px-3 py-2" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-gray-500">to</span>
          <input type="date" className="border rounded px-3 py-2" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button className="ml-2 bg-gray-100 border px-3 py-2 rounded" onClick={() => { setDateFrom(''); setDateTo('') }}>Clear</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button onClick={() => doBulk('Approved')} className="bg-green-600 text-white px-3 py-2 rounded">Bulk Approve</button>
          <button onClick={() => doBulk('Rejected')} className="bg-red-600 text-white px-3 py-2 rounded">Bulk Reject</button>
          <button onClick={exportView} className="bg-blue-600 text-white px-3 py-2 rounded">Export CSV</button>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''} • Page {page}/{pages}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">
                <input type="checkbox" checked={selectAllOnPage} onChange={toggleSelectAllOnPage} />
              </th>
              <th className="px-4 py-3">Name of SP</th>
              <th className="px-4 py-3">Verification Type</th>
              <th className="px-4 py-3">Attachment</th>
              <th className="px-4 py-3">Submission Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageRows.length === 0 && (
              <tr>
                <td colSpan="7" className="px-4 py-6 text-center text-gray-500">No rows found</td>
              </tr>
            )}
            {currentPageRows.map(row => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} />
                </td>
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.type}</td>
                <td className="px-4 py-3">
                  {row.attachment && row.attachment.kind === 'image' ? (
                    <button onClick={() => openPreview(row.attachment)} className="inline-block">
                      <img src={row.attachment.value} alt="attachment" className="w-20 h-12 object-cover rounded cursor-pointer border" />
                    </button>
                  ) : row.attachment && row.attachment.kind === 'text' ? (
                    <button onClick={() => openPreview(row.attachment)} className="text-blue-600 underline truncate max-w-xs block text-left">
                      {row.attachment.value}
                    </button>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3">
                  <span className={
                    row.status === 'Approved' ? 'text-green-700' : row.status === 'Rejected' ? 'text-red-700' : 'text-yellow-700'
                  }>{row.status}</span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => toggleRowStatus(row.id, 'Approved')}
                    className="bg-green-500 text-white px-2 py-1 rounded"
                  >Approve</button>
                  <button
                    onClick={() => toggleRowStatus(row.id, 'Rejected')}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded mr-2">Prev</button>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 border rounded">Next</button>
        </div>

        <div className="text-sm text-gray-600">
          Selected {selected.size} row{selected.size !== 1 ? 's' : ''}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Attachment preview</h3>
              <div className="flex items-center space-x-2">
                {preview.kind === 'image' ? (
                  <button onClick={() => downloadImage(preview.value)} className="text-sm px-3 py-1 bg-gray-100 rounded">Download</button>
                ) : (
                  <button onClick={() => copyText(preview.value)} className="text-sm px-3 py-1 bg-gray-100 rounded">Copy</button>
                )}
                <button onClick={closePreview} className="text-sm px-3 py-1 bg-red-100 rounded">Close</button>
              </div>
            </div>

            <div className="p-6">
              {preview.kind === 'image' ? (
                <img src={preview.value} alt="preview" className="w-full h-auto rounded" />
              ) : (
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">{preview.value}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
