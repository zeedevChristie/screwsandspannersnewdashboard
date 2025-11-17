import React, { useMemo, useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

export default function RolesAndRightsTable({ roles, onEdit, onDelete, onToggleStatus }) {
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [openMenuId, setOpenMenuId] = useState(null)
  const menusRef = useRef(new Map())

  const roleNames = useMemo(() => ['All Roles', ...Array.from(new Set(roles.map(r => r.roleName)))], [roles])

  const filtered = roles.filter(r => {
    if (roleFilter !== 'All Roles' && r.roleName !== roleFilter) return false
    if (statusFilter !== 'All Status' && r.status !== statusFilter) return false
    if (query && !(r.roleName.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase()))) return false
    return true
  })

  useEffect(() => {
    function onDocClick(e) {
      // close any open menu when clicking outside
      if (!openMenuId) return
      const menuEl = menusRef.current.get(openMenuId)
      if (menuEl && !menuEl.contains(e.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [openMenuId])

  return (
    <div>
      <div className="flex  flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center  gap-5 flex-wrap">
          <select className="border px-3 py-2 rounded" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            {roleNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select className="border px-3 py-2 rounded" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <input
            placeholder="Search admin"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border px-3 py-2 rounded max-w-xs"
          />
        </div>
        <div className="text-sm text-slate-500">Showing {filtered.length} of {roles.length}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className=" bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Role Name</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Description</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Assigned</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Status</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Created</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className=" bg-gray- divide-y divide-slate-100">
            {filtered.map(r => {
              const menuOpen = openMenuId === r.id
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 align-top">
                    <div className="font-medium text-slate-800">{r.roleName}</div>
                  </td>

                  <td className="px-3 py-2 align-top max-w-[36ch]">
                    <div className="text-sm text-slate-600 line-clamp-2">{r.description}</div>
                  </td>

                  <td className="px-3 py-2 align-top">
                    <div className="text-sm text-slate-700">{r.assigned}</div>
                  </td>

                  <td className="px-3 py-2 align-top">
                    <span className={clsx('px-2 py-1 rounded text-xs font-medium', r.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>{r.status}</span>
                  </td>

                  <td className="px-3 py-2 align-top">
                    <div className="text-sm text-slate-600">{r.created}</div>
                  </td>

                  <td className="px-3 py-2 align-top relative text-right">
                    {/* Icon button that controls the actions menu */}
                    <button
                      aria-expanded={menuOpen}
                      aria-controls={`actions-${r.id}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(prev => (prev === r.id ? null : r.id))
                      }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100"
                      title="Actions"
                    >
                      {/* simple vertical ellipsis icon */}
                      <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M12 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4zm0 7a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* dropdown menu anchored to the icon */}
                    {menuOpen && (
                      <div
                        id={`actions-${r.id}`}
                        ref={el => menusRef.current.set(r.id, el)}
                        className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-20"
                        onClick={e => e.stopPropagation()}
                      >
                        <ul className="py-1">
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                onToggleStatus(r.id)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              {r.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                onEdit(r)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                            >
                              Open
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                onDelete(r.id)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-slate-50"
                            >
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center text-slate-500">No roles found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
