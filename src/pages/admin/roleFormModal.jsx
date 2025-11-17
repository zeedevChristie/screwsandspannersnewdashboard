import React, { useEffect, useState } from 'react'

export default function RoleFormModal({ initial, onClose, onCreate, onUpdate }) {
  const empty = {
    roleName: '',
    description: '',
    assigned: 0,
    status: 'Active',
    created: new Date().toLocaleDateString()
  }

  const [form, setForm] = useState(initial ? { ...initial } : empty)

  useEffect(() => {
    setForm(initial ? { ...initial } : empty)
  }, [initial])

  const submit = (e) => {
    e.preventDefault()
    const payload = {
      roleName: form.roleName.trim(),
      description: form.description.trim(),
      assigned: Number(form.assigned) || 0,
      status: form.status,
      created: form.created || new Date().toLocaleDateString()
    }
    if (!payload.roleName) return alert('Role name is required')
    if (initial && initial.id) {
      onUpdate(initial.id, payload)
    } else {
      onCreate(payload)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded shadow-lg z-50 overflow-auto max-h-[90vh]">
        <form onSubmit={submit} className="p-4 md:p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-semibold">{initial ? 'Edit Role' : 'Create New Role'}</h2>
            <button type="button" onClick={onClose} className="text-slate-500 px-2 py-1 rounded hover:bg-slate-100">Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
              <input className="w-full border px-3 py-2 rounded" value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned (number)</label>
              <input type="number" className="w-full border px-3 py-2 rounded" value={form.assigned} onChange={e => setForm(f => ({ ...f, assigned: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea rows="4" className="w-full border px-3 py-2 rounded" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select className="w-full border px-3 py-2 rounded" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Created</label>
              <input className="w-full border px-3 py-2 rounded" value={form.created} onChange={e => setForm(f => ({ ...f, created: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{initial ? 'Update Role' : 'Create Role'}</button>
            <button type="button" onClick={onClose} className="bg-gray-100 px-4 py-2 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
