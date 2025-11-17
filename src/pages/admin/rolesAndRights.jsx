import React, { useEffect, useState } from 'react'
import RolesAndRightsTable from './rolesAndRightsTable'
import RoleFormModal from './roleFormModal'


const SAMPLE = [
  {
    id: '1',
    roleName: 'User Management Admin',
    description: 'Create and manage user accounts, assign roles and access rights, deactivate/suspend accounts',
    assigned: 10,
    status: 'Active',
    created: '05–May–2025'
  },
  {
    id: '2',
    roleName: 'Service Delivery Admin',
    description: 'Manage Service Providers & Customers, maintain category tree, handle verification, manage badges',
    assigned: 12,
    status: 'Inactive',
    created: '06–May–2025'
  },
  {
    id: '3',
    roleName: 'Supplier Admin',
    description: 'Onboard and manage suppliers, verify supplier details and documentation',
    assigned: 14,
    status: 'Active',
    created: '07–May–2025'
  },
  {
    id: '4',
    roleName: 'Promotion Admin',
    description: 'Create and manage promotions, approve featured listings and marketing campaigns',
    assigned: 16,
    status: 'Active',
    created: '08–May–2025'
  },
  {
    id: '5',
    roleName: 'Verification Admin',
    description: 'Approve or reject verification requests, monitor compliance, revoke verification if needed',
    assigned: 18,
    status: 'Inactive',
    created: '09–May–2025'
  },
  {
    id: '6',
    roleName: 'Badge Admin',
    description: 'Assign and revoke badges, ensure badges reflect credibility and performance accurately',
    assigned: 20,
    status: 'Active',
    created: '10–May–2025'
  },
  {
    id: '7',
    roleName: 'Reporting Admin',
    description: 'Generate and view reports, track usage, transactions, and platform activities',
    assigned: 22,
    status: 'Active',
    created: '11–May–2025'
  },
  {
    id: '8',
    roleName: 'Audit Admin',
    description: 'Monitor audit trails, track admin and user activity logs, ensure compliance and accountability',
    assigned: 24,
    status: 'Inactive',
    created: '12–May–2025'
  },
  {
    id: '9',
    roleName: 'Support Admin',
    description: 'Manage support tickets through New, Open, Resolved, and Dispu',
    assigned: 26,
    status: 'Active',
    created: '01–Jan–2022'
  }
]

export default function RolesAndRights() {
  const [roles, setRoles] = useState(() => {
    const raw = localStorage.getItem('roles_v1')
    return raw ? JSON.parse(raw) : SAMPLE
  })
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null) // role object or null

  useEffect(() => {
    localStorage.setItem('roles_v1', JSON.stringify(roles))
  }, [roles])

  const addRole = (role) => {
    setRoles(prev => [{ ...role, id: Date.now().toString() }, ...prev])
  }

  const updateRole = (id, updates) => {
    setRoles(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)))
  }

  const removeRole = (id) => {
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (role) => {
    setEditing(role)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 p- md:p-">
      <div className="max-w-7xl mx-auto  bg-gray-100 shadow rounded-lg p-4 md:p-">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Admin Management</h1>
            <p className="text-sm text-slate-500">Manage system administrator roles, permissions and assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openNew}
              className="inline-flex items-center bg-black text-white px-3 py-2 rounded shadow hover:bg-indigo-700"
            >
              + Create New Role
            </button>
          </div>
        </header>

        <RolesAndRightsTable
          roles={roles}
          onEdit={openEdit}
          onDelete={removeRole}
          onToggleStatus={(id) =>
            updateRole(id, {
              status: roles.find(r => r.id === id).status === 'Active' ? 'Inactive' : 'Active'
            })
          }
        />
      </div>

      {showForm && (
        <RoleFormModal
          initial={editing}
          onClose={closeForm}
          onCreate={(data) => {
            addRole({ ...data, created: data.created || new Date().toLocaleDateString() })
            closeForm()
          }}
          onUpdate={(id, data) => {
            updateRole(id, data)
            closeForm()
          }}
        />
      )}
    </div>
  )
}
