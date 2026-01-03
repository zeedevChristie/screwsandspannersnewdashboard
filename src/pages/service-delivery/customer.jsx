import React, { useEffect, useMemo, useState } from "react";
import AddCustomerModal from "./addCustomerModal";
import ConfirmDialog from "./confirmDialog";
import {
  exportCSV,
  filterByDateRange,
  filterByPackage,
  filterByStatus,
  searchRows,
} from "./customers";
import ViewCustomerModal from "./viewCustomerModal";

export default function Customer() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  // FETCH CUSTOMERS
async function fetchCustomers() {
  try {
    setLoading(true);

    const token = localStorage.getItem("authToken"); 

    const res = await fetch("https://app.api.screwsandspanners.com/api/v1/auth/customers", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    const apiData = json?.data?.customers || [];

    const arr = apiData.map((c) => ({
      id: c.id,
      name: `${c.firstname || ""} ${c.lastname || ""}`,
      email: c.email,
      phone: c.phone,
      subscription: c.subscription?.isActive ? "Active" : "Inactive",
      packageType: c.subscription?.plan?.description || "N/A",
      amountPaid: c.subscription?.plan?.amount || 0,
      validityFrom: c.subscription?.transaction?.createdAt || "N/A",
      validityTo: c.subscription?.expiryDate || "N/A",
      status: c.subscription?.isActive ? "Active" : "Inactive",
      dateSubscribed: c.subscription?.transaction?.createdAt || c.created_at,
      promoCode: c.subscription?.promoCode || "-",
    }));

    setRows(arr);
    setError("");
  } catch (err) {
    console.error(err);
    setError("Failed to load customers");
  } finally {
    setLoading(false);
  }
}

useEffect(() => {
  fetchCustomers();
}, []);


  // APPLY FILTERS 
  const filtered = useMemo(() => {
    let output = [];

    for (let i = 0; i < rows.length; i++) {
      let r = rows[i];

      // manual search
      if (query && !searchRows([r], query).length) continue;

      // status filter
      if (statusFilter && filterByStatus([r], statusFilter).length === 0)
        continue;

      // package
      if (packageFilter && filterByPackage([r], packageFilter).length === 0)
        continue;

      // date range
      if (
        (dateFrom || dateTo) &&
        filterByDateRange([r], dateFrom, dateTo).length === 0
      )
        continue;

      output.push(r);
    }

    return output;
  }, [rows, query, statusFilter, packageFilter, dateFrom, dateTo]);

  // TOGGLE ACTIVE 
  function toggleActive(id) {
    const updated = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.id === id) {
        updated.push({
          ...r,
          status: r.status === "Active" ? "Inactive" : "Active",
        });
      } else {
        updated.push(r);
      }
    }

    setRows(updated);
  }

  // DELETE CUSTOMER
  function confirmDelete() {
    const newArr = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].id !== confirm.id) newArr.push(rows[i]);
    }
    setRows(newArr);
    setConfirm({ open: false, id: null });
  }

  function handleAdd(newRow) {
    setRows([newRow, ...rows]);
  }

  function handleExport() {
    exportCSV(filtered, "customers-export.csv");
  }

  // UI
  if (loading) return <div className="p-6">Loading customers...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="text-sm text-gray-500">View and manage all customers</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 border rounded bg-white"
          >
            Export Details
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="px-3 py-2 bg-indigo-600 text-white rounded"
          >
            + Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-auto flex-grow"
            placeholder="Search customers..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All packages</option>
            <option value="Premium Monthly">Premium Monthly</option>
            <option value="Standard Quarterly">Standard Quarterly</option>
            <option value="Basic Monthly">Basic Monthly</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="px-3 py-2 border rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {/* TABLE*/}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Subscription</th>
                <th className="p-3 text-left">Package</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Validity From</th>
                <th className="p-3 text-left">Validity To</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Subscribed</th>
                <th className="p-3 text-left">Promo</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {(() => {
                const items = [];

                for (let i = 0; i < filtered.length; i++) {
                  const r = filtered[i];
                  items.push(
                    <tr key={r.id} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-gray-500">{r.email}</div>
                      </td>

                      <td className="p-3">{r.subscription}</td>
                      <td className="p-3">{r.packageType}</td>
                      <td className="p-3">
                        ₦{Number(r.amountPaid).toLocaleString()}
                      </td>

                      <td className="p-3">
                        {new Date(r.validityFrom).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {new Date(r.validityTo).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            r.status === "Active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>

                      <td className="p-3">
                        {new Date(r.dateSubscribed).toLocaleDateString()}
                      </td>
                      <td className="p-3">{r.promoCode}</td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCustomer(r)}
                            className="px-2 py-1 border rounded"
                          >
                            View
                          </button>
                          <button
                            onClick={() => toggleActive(r.id)}
                            className="px-2 py-1 border rounded"
                          >
                            {r.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setConfirm({ open: true, id: r.id })}
                            className="px-2 py-1 border rounded text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                if (filtered.length === 0) {
                  items.push(
                    <tr key="empty">
                      <td colSpan={9} className="p-4 text-gray-500">
                        No records found
                      </td>
                    </tr>
                  );
                }

                return items;
              })()}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <div>
            Showing {filtered.length} of {rows.length} entries
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 border rounded">Prev</button>
            <span>Page 1 of 1</span>
            <button className="px-2 py-1 border rounded">Next</button>
          </div>
        </div>
      </div>

      <ViewCustomerModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
      />
      <AddCustomerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
      <ConfirmDialog
        open={confirm.open}
        title="Delete customer"
        message="Are you sure?"
        onCancel={() => setConfirm({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
