import React, { useMemo, useState } from 'react';
import AddCustomerModal from './addCustomerModal';
import ConfirmDialog from './confirmDialog';
import { exportCSV, filterByDateRange, filterByPackage, filterByStatus, searchRows } from './customers';
import ViewCustomerModal from './viewCustomerModal';
import { Customers } from './spData';


export default function Customer() {
  const [rows, setRows] = useState(Customers);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const filtered = useMemo(() => {
    let out = [...rows];
    out = searchRows(out, query);
    out = filterByStatus(out, statusFilter);
    out = filterByPackage(out, packageFilter);
    out = filterByDateRange(out, dateFrom, dateTo);
    return out;
  }, [rows, query, statusFilter, packageFilter, dateFrom, dateTo]);

  function toggleActive(id) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r)));
  }

  function handleDelete(id) {
    setConfirm({ open: true, id });
  }

  function confirmDelete() {
    setRows((prev) => prev.filter((r) => r.id !== confirm.id));
    setConfirm({ open: false, id: null });
  }

  function handleAdd(newRow) {
    setRows((prev) => [newRow, ...prev]);
  }

  function handleExport() {
    exportCSV(filtered, 'customers-export.csv');
  }

  return (
    <div className="">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="text-sm text-gray-500">View and manage all customers</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExport} className="px-3 py-2 border rounded bg-white">Export Details</button>
          <button onClick={() => setAddOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">+ Add Customer</button>
        </div>
      </div>

      <div className="bg-white rounded shadow p- space-y-4">
        <div className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers, email, business..." className="border rounded px-3 py-2 w-full" />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select value={packageFilter} onChange={(e) => setPackageFilter(e.target.value)} className="border rounded px-3 py-2">
            <option value="">All packages</option>
            <option value="Premium Monthly">Premium Monthly</option>
            <option value="Standard Quarterly">Standard Quarterly</option>
            <option value="Basic Monthly">Basic Monthly</option>
          </select>

          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border rounded px-3 py-2" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border rounded px-3 py-2" />
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="px-3 py-2 border rounded">Clear</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Package Type</th>
                <th className="p-3 text-left">Amount Paid</th>
                <th className="p-3 text-left">Validity From</th>
                <th className="p-3 text-left">Validity To</th>
                <th className="p-3 text-left">Subscription Status</th>
                <th className="p-3 text-left">Date Subscribed</th>
                <th className="p-3 text-left">Promo code</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </td>
                  <td className="p-3">{r.packageType}</td>
                  <td className="p-3">₦{r.amountPaid.toLocaleString()}</td>
                  <td className="p-3">{new Date(r.validityFrom).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(r.validityTo).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${r.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(r.dateSubscribed).toLocaleDateString()}</td>
                  <td className="p-3">{r.promoCode}</td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => setSelectedCustomer(r)} className="text-sm px-2 py-1 border rounded">View</button>
                      <button onClick={() => toggleActive(r.id)} className="text-sm px-2 py-1 border rounded">
                        {r.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-sm px-2 py-1 border rounded text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-4 text-sm text-gray-500" colSpan={9}>No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>Showing {filtered.length} of {rows.length} entries</div>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded">Prev</button>
            <span>Page 1 of 1</span>
            <button className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      <ViewCustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      <AddCustomerModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <ConfirmDialog open={confirm.open} title="Delete customer" message="Are you sure you want to delete this customer?" onCancel={() => setConfirm({ open: false, id: null })} onConfirm={confirmDelete} />
    </div>
  );
}
