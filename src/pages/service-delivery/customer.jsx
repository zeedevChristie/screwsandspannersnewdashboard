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

/* ------------------ helpers ------------------ */
function formatDate(val) {
  if (!val) return "N/A";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
}

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

  /* ------------------ FETCH CUSTOMERS ------------------ */
  async function fetchCustomers() {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      const res = await fetch(
        "https://app.api.screwsandspanners.com/api/v1/auth/customers",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await res.json();
      console.log("Response data:", json);
      console.log("Response:", res);

      if (!res.ok) throw new Error("Failed to fetch customers");
      const customers = json?.data?.customers || [];

      const mapped = customers.map((c) => ({
        id: c.id,

        name: `${c.firstname || ""} ${c.lastname || ""}`.trim() || "N/A",
        email: c.email || "N/A",
        phone: c.phone || "N/A",

        jobOrders: c.completed_jobs_count ?? "N/A",

        subscriptionType: c.subscription?.plan?.description || "N/A",

        promoType: "N/A", // not available yet
        promoCode: "N/A", // not available yet

        baseAmount:
          c.subscription?.plan?.amount && c.subscription.plan.amount > 0
            ? c.subscription.plan.amount
            : "N/A",

        amountPaid:
          c.subscription?.transaction?.amount &&
          c.subscription.transaction.amount > 0
            ? c.subscription.transaction.amount
            : "N/A",

        dateSubscribed:
          c.subscription?.transaction?.createdAt || c.created_at || null,

        validityFrom:
          c.subscription?.transaction?.createdAt || null,

        validityTo:
          c.subscription?.expiryDate || null,

        status: c.subscription?.isActive ? "Active" : "Inactive",
      }));

      setRows(mapped);
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

  /* ------------------ FILTERS ------------------ */
  const filtered = useMemo(() => {
    const output = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      if (query && !searchRows([r], query).length) continue;
      if (statusFilter && !filterByStatus([r], statusFilter).length) continue;
      if (packageFilter && !filterByPackage([r], packageFilter).length)
        continue;
      if (
        (dateFrom || dateTo) &&
        !filterByDateRange([r], dateFrom, dateTo).length
      )
        continue;

      output.push(r);
    }

    return output;
  }, [rows, query, statusFilter, packageFilter, dateFrom, dateTo]);

  /* ------------------ ACTIONS ------------------ */
  function toggleActive(id) {
    const updated = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      updated.push(
        r.id === id
          ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" }
          : r
      );
    }

    setRows(updated);
  }

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

  /* ------------------ UI ------------------ */
  if (loading) return <div className="p-6">Loading customers…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          <p className="text-sm text-gray-500">
            View and manage all customers
          </p>
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">JobOrders</th>
                <th className="p-3 text-left">Subscription</th>
                <th className="p-3 text-left">PromoType</th>
                <th className="p-3 text-left">PromoCode</th>
                <th className="p-3 text-left">BaseAmount</th>
                <th className="p-3 text-left">AmountPaid</th>
                <th className="p-3 text-left">DateSubscribed</th>
                <th className="p-3 text-left">ValidityFrom</th>
                <th className="p-3 text-left">ValidityTo</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-4 text-gray-500">
                    No records found
                  </td>
                </tr>
              )}

              {filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.email}</div>
                  </td>
                  <td className="p-3">{r.jobOrders}</td>
                  <td className="p-3">{r.subscriptionType}</td>
                  <td className="p-3">{r.promoType}</td>
                  <td className="p-3">{r.promoCode}</td>
                  <td className="p-3">{r.baseAmount}</td>
                  <td className="p-3">
                    {r.amountPaid === "N/A"
                      ? "N/A"
                      : `₦${Number(r.amountPaid).toLocaleString()}`}
                  </td>
                  <td className="p-3">{formatDate(r.dateSubscribed)}</td>
                  <td className="p-3">{formatDate(r.validityFrom)}</td>
                  <td className="p-3">{formatDate(r.validityTo)}</td>
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
                        onClick={() =>
                          setConfirm({ open: true, id: r.id })
                        }
                        className="px-2 py-1 border rounded text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <div>
            Showing {filtered.length} of {rows.length} entries
          </div>
        </div>
      </div>

      {/* Modals */}
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
