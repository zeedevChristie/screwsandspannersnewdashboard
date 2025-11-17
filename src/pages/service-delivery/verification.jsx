import React, { useMemo, useState } from 'react'
// import './index.css'
import VerificationTable from './verificationTable'

const initialData = [
  { id: 1, name: 'Alice Smith', type: 'Passport', attachment: { kind: 'image', value: 'https://via.placeholder.com/300x200.png?text=Passport+1' }, date: '2022-01-01', status: 'Pending' },
  { id: 2, name: 'Alice Smith', type: 'NIN', attachment: { kind: 'text', value: 'NIN: 12345678901' }, date: '2022-06-12', status: 'Approved' },
  { id: 3, name: 'Alice Smith', type: 'BVN', attachment: { kind: 'text', value: 'BVN: 98765432109' }, date: '2023-03-05', status: 'Rejected' },
  { id: 4, name: 'Alice Smith', type: 'Passport', attachment: { kind: 'image', value: 'https://via.placeholder.com/300x200.png?text=Passport+2' }, date: '2024-11-10', status: 'Pending' },
  { id: 5, name: 'Alice Smith', type: 'NIN', attachment: { kind: 'image', value: 'https://via.placeholder.com/300x200.png?text=BVN+Card' }, date: '2025-05-12', status: 'Pending' }
]

export default function App() {
  const [rows, setRows] = useState(initialData)

  const handleUpdateStatus = (ids, newStatus) => {
    setRows(prev => prev.map(r => (ids.includes(r.id) ? { ...r, status: newStatus } : r)))
  }

  const verificationTypes = useMemo(() => ['Passport','NIN','BVN'], [])
  const statuses = ['Pending', 'Approved', 'Rejected']

  return (
    <div className="p- min-h-screen ">
      <div className="max-w-6xl mx-auto">
        <div className="pb-2 ">
          <h1 className="text-2xl font-semibold">Verification</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all service providers</p>
        </div>
        <VerificationTable
          data={rows}
          onBulkUpdate={handleUpdateStatus}
          verificationTypes={verificationTypes}
          statuses={statuses}
        />
      </div>
    </div>
  )
}
