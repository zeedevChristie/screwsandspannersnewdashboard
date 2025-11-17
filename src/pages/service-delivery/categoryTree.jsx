import React, { useMemo, useState } from 'react'

/* Utility helpers */
function downloadCSV(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')]
    .concat(rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* Mock data: categories with subcategories and skills */
const initialCategories = [
  {
    id: 'cat-1',
    name: 'Beauty & Skincare',
    subcategories: [
      { id: 'sc-1', name: 'Passport', skills: ['Label', 'Dermaplaning', 'Facial'] },
      { id: 'sc-2', name: 'Makeup', skills: ['Contouring', 'Label'] }
    ]
  },
  {
    id: 'cat-2',
    name: 'Wellness & Fitness',
    subcategories: [
      { id: 'sc-3', name: 'Yoga', skills: ['Beginner Flow', 'Label'] },
      { id: 'sc-4', name: 'Nutrition', skills: [] }
    ]
  },
  {
    id: 'cat-3',
    name: 'Programming',
    subcategories: [
      { id: 'sc-5', name: 'Web', skills: ['React', 'Vue', 'Label'] },
      { id: 'sc-6', name: 'Data', skills: ['Pandas'] }
    ]
  },
  {
    id: 'cat-4',
    name: 'Photography',
    subcategories: [
      { id: 'sc-7', name: 'Portrait', skills: ['Lighting', 'Editing'] }
    ]
  },
  {
    id: 'cat-5',
    name: 'Languages',
    subcategories: [
      { id: 'sc-8', name: 'English', skills: ['Grammar', 'Label'] },
      { id: 'sc-9', name: 'French', skills: ['Beginner'] }
    ]
  }
]

/* Small unique id generator */
const uid = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 9)}`

export default function CategoryTree() {
  const [categories, setCategories] = useState(initialCategories)
  const [query, setQuery] = useState('')
  const [subFilter, setSubFilter] = useState('All') // subcategory name or All
  const [hasSkillFilter, setHasSkillFilter] = useState('All') // All, WithSkills, WithoutSkills
  const [selected, setSelected] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(null) // {type:'category'|'subcategory'|'skill', ids..., data...}
  const [confirmDelete, setConfirmDelete] = useState(null) // {type, id, name}
  const [importJson, setImportJson] = useState('')

  /* Derived lists for filter options */
  const allSubNames = useMemo(() => {
    const names = new Set()
    categories.forEach(c => c.subcategories.forEach(s => names.add(s.name)))
    return Array.from(names)
  }, [categories])

  /* Filtered view computed from query and filters */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categories
      .map(cat => {
        const subcats = cat.subcategories
          .filter(sc => {
            if (subFilter !== 'All' && sc.name !== subFilter) return false
            if (hasSkillFilter === 'WithSkills' && sc.skills.length === 0) return false
            if (hasSkillFilter === 'WithoutSkills' && sc.skills.length > 0) return false
            if (!q) return true
            if (cat.name.toLowerCase().includes(q)) return true
            if (sc.name.toLowerCase().includes(q)) return true
            if (sc.skills.some(skill => skill.toLowerCase().includes(q))) return true
            return false
          })
          .map(sc => ({ ...sc }))
        if (!q && subFilter === 'All' && hasSkillFilter === 'All') {
          return { ...cat, subcategories: cat.subcategories.map(s => ({ ...s })) }
        }
        if (subcats.length === 0) return null
        return { ...cat, subcategories: subcats }
      })
      .filter(Boolean)
  }, [categories, query, subFilter, hasSkillFilter])

  /* Selection helpers */
  function toggleSelectCat(catId) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === categories.length) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(categories.map(c => c.id)))
  }

  /* Add / Edit / Delete actions */
  function addCategory({ name }) {
    const newCat = { id: uid('cat-'), name: name || 'Untitled Category', subcategories: [] }
    setCategories(prev => [newCat, ...prev])
    setShowAddModal(false)
  }

  function editCategory(id, updates) {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)))
    setEditing(null)
  }

  function deleteCategory(id) {
    setCategories(prev => prev.filter(c => c.id !== id))
    setConfirmDelete(null)
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function addSubcategory(catId, { name }) {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      const sc = { id: uid('sc-'), name: name || 'New Subcategory', skills: [] }
      return { ...c, subcategories: [...c.subcategories, sc] }
    }))
    setEditing(null)
  }

  function editSubcategory(catId, scId, updates) {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return { ...c, subcategories: c.subcategories.map(s => s.id === scId ? { ...s, ...updates } : s) }
    }))
    setEditing(null)
  }

  function deleteSubcategory(catId, scId) {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return { ...c, subcategories: c.subcategories.filter(s => s.id !== scId) }
    }))
    setConfirmDelete(null)
  }

  function addSkill(catId, scId, skillName) {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return { ...c, subcategories: c.subcategories.map(s => {
        if (s.id !== scId) return s
        return { ...s, skills: [...s.skills, skillName || 'New Skill'] }
      }) }
    }))
    setEditing(null)
  }

  function deleteSkill(catId, scId, skillIdx) {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return { ...c, subcategories: c.subcategories.map(s => {
        if (s.id !== scId) return s
        const newSkills = s.skills.slice()
        newSkills.splice(skillIdx, 1)
        return { ...s, skills: newSkills }
      }) }
    }))
  }

  function bulkDeleteSelected() {
    const ids = Array.from(selected)
    if (!ids.length) return alert('No categories selected')
    if (!confirm(`Delete ${ids.length} categories? This will remove their subcategories and skills.`)) return
    setCategories(prev => prev.filter(c => !ids.includes(c.id)))
    setSelected(new Set())
  }

  /* Export current filtered view as CSV rows (flattened) */
  function exportCSV() {
    const rows = []
    filtered.forEach(cat => {
      if (cat.subcategories.length === 0) {
        rows.push({ category: cat.name, subcategory: '', skill: '' })
      } else {
        cat.subcategories.forEach(sc => {
          if (sc.skills.length === 0) rows.push({ category: cat.name, subcategory: sc.name, skill: '' })
          else sc.skills.forEach(skill => rows.push({ category: cat.name, subcategory: sc.name, skill }))
        })
      }
    })
    downloadCSV('categories.csv', rows)
  }

  // /* Import JSON text into categories (basic validation) */
  // function importCategoriesFromJson() {
  //   try {
  //     const parsed = JSON.parse(importJson)
  //     if (!Array.isArray(parsed)) throw new Error('JSON must be an array of categories')
  //     // Basic shape normalization
  //     const normalized = parsed.map((c, i) => ({
  //       id: c.id || uid('cat-'),
  //       name: c.name || `Imported ${i}`,
  //       subcategories: Array.isArray(c.subcategories) ? c.subcategories.map((s, j) => ({
  //         id: s.id || uid('sc-'),
  //         name: s.name || `Sub ${j}`,
  //         skills: Array.isArray(s.skills) ? s.skills.slice() : []
  //       })) : []
  //     }))
  //     setCategories(prev => [...normalized, ...prev])
  //     setImportJson('')
  //     alert(`Imported ${normalized.length} categories`)
  //   } catch (err) {
  //     alert('Invalid JSON: ' + err.message)
  //   }
  // }

  /* Helper to open delete confirmation */
  function confirmDeleteTarget(type, payload) {
    setConfirmDelete({ type, payload })
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Categories ({categories.length})</h2>
            <p className="text-sm text-gray-500">Manage categories, sub-categories and skills</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setShowAddModal(true); setEditing({ type: 'category-new' }) }} className="bg-blue-600 text-white px-3 py-2 rounded">+ Add New</button>
            <button onClick={() => { setImportJson(JSON.stringify(categories, null, 2)); alert('Paste JSON into import area to test') }} className="bg-gray-100 px-3 py-2 rounded">Import Category Tree</button>
            <button onClick={exportCSV} className="bg-green-600 text-white px-3 py-2 rounded">Export CSV</button>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search Categories by name, skill"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select className="border rounded px-3 py-2" value={subFilter} onChange={e => setSubFilter(e.target.value)}>
            <option value="All">All sub-categories</option>
            {allSubNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="border rounded px-3 py-2" value={hasSkillFilter} onChange={e => setHasSkillFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="WithSkills">With skills</option>
            <option value="WithoutSkills">Without skills</option>
          </select>
        </div>
      </div>

      {/* <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <input type="checkbox" checked={selected.size === categories.length && categories.length > 0} onChange={toggleSelectAll} />
            <button onClick={bulkDeleteSelected} className="text-sm text-red-600">Bulk Delete</button>
            <div className="text-sm text-gray-600">Selected {selected.size}</div>
          </div>

          <div className="flex items-center space-x-3">
            <textarea
              className="border rounded px-3 py-2 w-72 h-24 text-xs"
              placeholder="Paste categories JSON here to import (array of categories)"
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
            <div className="flex flex-col">
              <button onClick={importCategoriesFromJson} className="bg-indigo-600 text-white px-3 py-2 rounded mb-2">Import JSON</button>
              <button onClick={() => { setImportJson(''); alert('Cleared') }} className="bg-gray-100 px-3 py-2 rounded">Clear</button>
            </div>
          </div>
        </div>
      </div> */}

      <div className="p-4 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 p-6">No categories found.</div>
        )}

        {filtered.map(cat => (
          <div key={cat.id} className="border rounded p-4 bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <input type="checkbox" checked={selected.has(cat.id)} onChange={() => toggleSelectCat(cat.id)} />
                  <div>
                    <div className="font-semibold">{cat.name} <span className="text-sm text-gray-500">({cat.subcategories.length})</span></div>
                    <div className="text-xs text-gray-500 mt-1">Sub-categories: {cat.subcategories.map(s => s.name).join(', ') || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={() => { setEditing({ type: 'category-edit', id: cat.id, name: cat.name }) }} className="px-2 py-1 border rounded text-sm">Edit</button>
                <button onClick={() => { setEditing({ type: 'add-sub', catId: cat.id }); }} className="px-2 py-1 border rounded text-sm">+ Add Sub</button>
                <button onClick={() => confirmDeleteTarget('category', { id: cat.id, name: cat.name })} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {cat.subcategories.map(sc => (
                <div key={sc.id} className="p-3 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{sc.name} <span className="text-xs text-gray-400">({sc.skills.length})</span></div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setEditing({ type: 'sub-edit', catId: cat.id, scId: sc.id, name: sc.name })} className="text-xs px-2 py-1 border rounded">Edit</button>
                      <button onClick={() => confirmDeleteTarget('subcategory', { catId: cat.id, scId: sc.id, name: sc.name })} className="text-xs px-2 py-1 border rounded">Delete</button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {sc.skills.length === 0 && <div className="text-xs text-gray-400">No skills</div>}
                    {sc.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded text-xs">
                        <span>{skill}</span>
                        <button onClick={() => deleteSkill(cat.id, sc.id, idx)} className="text-red-500 text-xs">x</button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <button onClick={() => setEditing({ type: 'add-skill', catId: cat.id, scId: sc.id })} className="text-sm px-2 py-1 border rounded">+ Add New Skill</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modals and inline editors */}
      {showAddModal && editing?.type === 'category-new' && (
        <Modal onClose={() => { setShowAddModal(false); setEditing(null) }}>
          <AddCategoryForm
            onCancel={() => { setShowAddModal(false); setEditing(null) }}
            onSave={vals => addCategory(vals)}
          />
        </Modal>
      )}

      {editing && editing.type === 'category-edit' && (
        <Modal onClose={() => setEditing(null)}>
          <EditCategoryForm initialName={editing.name} onCancel={() => setEditing(null)} onSave={vals => editCategory(editing.id, vals)} />
        </Modal>
      )}

      {editing && editing.type === 'add-sub' && (
        <Modal onClose={() => setEditing(null)}>
          <AddSubForm onCancel={() => setEditing(null)} onSave={vals => addSubcategory(editing.catId, vals)} />
        </Modal>
      )}

      {editing && editing.type === 'sub-edit' && (
        <Modal onClose={() => setEditing(null)}>
          <EditSubForm initialName={editing.name} onCancel={() => setEditing(null)} onSave={vals => editSubcategory(editing.catId, editing.scId, vals)} />
        </Modal>
      )}

      {editing && editing.type === 'add-skill' && (
        <Modal onClose={() => setEditing(null)}>
          <AddSkillForm onCancel={() => setEditing(null)} onSave={vals => addSkill(editing.catId, editing.scId, vals.skill)} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div>
            <h3 className="text-lg font-semibold mb-2">Delete {confirmDelete.type}</h3>
            <p className="text-sm text-gray-600 mb-4">Deleting will remove all nested items. Are you sure?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-2 border rounded">No, Go back</button>
              <button
                onClick={() => {
                  const { type, payload } = confirmDelete
                  if (type === 'category') deleteCategory(payload.id)
                  if (type === 'subcategory') deleteSubcategory(payload.catId, payload.scId)
                  setConfirmDelete(null)
                }}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* Modal wrapper */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded shadow-lg w-full max-w-2xl p-4">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

/* Simple forms below */
function AddCategoryForm({ onCancel, onSave }) {
  const [name, setName] = useState('')
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Add New Category</h3>
      <input className="w-full border rounded px-3 py-2 mb-3" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={() => onSave({ name })} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
      </div>
    </div>
  )
}

function EditCategoryForm({ initialName = '', onCancel, onSave }) {
  const [name, setName] = useState(initialName)
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Edit Category</h3>
      <input className="w-full border rounded px-3 py-2 mb-3" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={() => onSave({ name })} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  )
}

function AddSubForm({ onCancel, onSave }) {
  const [name, setName] = useState('')
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Add Sub-category</h3>
      <input className="w-full border rounded px-3 py-2 mb-3" placeholder="Sub-category name" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={() => onSave({ name })} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
      </div>
    </div>
  )
}

function EditSubForm({ initialName = '', onCancel, onSave }) {
  const [name, setName] = useState(initialName)
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Edit Sub-category</h3>
      <input className="w-full border rounded px-3 py-2 mb-3" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={() => onSave({ name })} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
      </div>
    </div>
  )
}

function AddSkillForm({ onCancel, onSave }) {
  const [skill, setSkill] = useState('')
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Add Skill</h3>
      <input className="w-full border rounded px-3 py-2 mb-3" placeholder="Skill name" value={skill} onChange={e => setSkill(e.target.value)} />
      <div className="flex justify-end space-x-2">
        <button onClick={onCancel} className="px-3 py-2 border rounded">Cancel</button>
        <button onClick={() => onSave({ skill })} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
      </div>
    </div>
  )
}
