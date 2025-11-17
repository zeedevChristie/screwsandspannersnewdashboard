import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import ServiceProviderFiltersBar from "./ServiceProviderfiltersBar";
import AddSpModal from "./addSPmodal";
import ViewSPModal from "./viewSpModal";

export default function ServiceProvidersDummy() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "All",
    status: "All",
    location: "All",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(0); // DataGrid uses 0-based index
  const [pageSize, setPageSize] = useState(10);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  // ✅ Fetch data with backend pagination + filters
  useEffect(() => {
    const params = new URLSearchParams({
      page: page + 1, // backend expects 1-based index
      limit: pageSize,
      query,
      category: filters.category !== "All" ? filters.category : "",
      status: filters.status !== "All" ? filters.status : "",
      location: filters.location !== "All" ? filters.location : "",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
    });

    setLoading(true);
    fetch(`https://app.api.screwsandspanners.com/api/v1/auth/sp-stats?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setRows(data.data.serviceProviders || []);
        setRowCount(data.data.pagination?.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load service providers:", err);
        setLoading(false);
      });
  }, [page, pageSize, filters, query]);

  // ✅ CSV export
  function exportCSV() {
    const header =
      "id,name,email,businessName,categories,phone,city,accountStatus,completedOrders,verification,createdAt\n";

    const lines = rows.map((r) => {
      const name = `${r.firstname || ""} ${r.lastname || ""}`.trim();
      const businessName = r.business?.business_name || "";
      const categories = Array.isArray(r.categories)
        ? r.categories.map((c) => c.title).join("; ")
        : "";
      const phone = r.phone || "";
      const city = r.city || "";
      const status = r.accountStatus || "";
      const completed = r.completedOrders ?? r.completed_jobs_count ?? "";
      const verification = r.verification ?? r.business?.verified ?? "";
      const createdAt = r.created_at || "";

      // Escape commas by wrapping in quotes if needed
      const safe = (val) =>
        typeof val === "string" && val.includes(",") ? `"${val}"` : val;

      return [
        r.id,
        safe(name),
        safe(r.email || ""),
        safe(businessName),
        safe(categories),
        safe(phone),
        safe(city),
        safe(status),
        completed,
        verification,
        createdAt,
      ].join(",");
    });

    const csv = header + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ServiceProviders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ✅ Dynamic filter options (from current rows/page)
  const allCategories = [
    "All",
    ...new Set(rows.flatMap((r) => (r.categories || []).map((c) => c.title))),
  ];
  const allStatuses = ["All", ...new Set(rows.map((r) => r.accountStatus).filter(Boolean))];
  const allLocations = ["All", ...new Set(rows.map((r) => r.city).filter(Boolean))];

  // ✅ DataGrid columns (with safe valueGetters)
  const columns = [
    {
      field: "avatar_location",
      headerName: "Profile",
      width: 80,
      renderCell: (params) =>
        params.value ? (
          <img
            src={`https://app.api.screwsandspanners.com/${params.value}`}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : null,
      sortable: false,
      filterable: false,
    },
    {
      field: "name",
      headerName: "Name",
      width: 160,
      // valueGetter: (params) =>
      //   params.row ? `${params.row.firstname || ""} ${params.row.lastname || ""}`.trim() : "",
    },
    {
      field: "business",
      headerName: "Business",
      width: 200,
      valueGetter: (params) => params.row?.business?.business_name || "",
    },
    {
      field: "categories",
      headerName: "Category",
      width: 240,
      valueGetter: (params) =>
        Array.isArray(params.row?.categories)
          ? params.row.categories.map((c) => c.title).join(", ")
          : "",
    },
    { field: "phone", headerName: "Phone", width: 140 },
    { field: "email", headerName: "Email", width: 220 },
    {
      field: "created_at",
      headerName: "Created At",
      width: 160,
      valueGetter: (params) =>
        params.row?.created_at ? new Date(params.row.created_at).toLocaleDateString() : "",
    },
    { field: "city", headerName: "City", width: 130 },
    { field: "accountStatus", headerName: "Status", width: 120 },
    {
      field: "verification",
      headerName: "Verification",
      width: 130,
      valueGetter: (params) =>
        params.row?.verification ?? params.row?.business?.verified ?? "",
    },
    {
      field: "completed",
      headerName: "Completed",
      width: 120,
      valueGetter: (params) =>
        params.row?.completedOrders ?? params.row?.completed_jobs_count ?? "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          <button className="text-blue-600" onClick={() => setSelected(params.row)}>
            View
          </button>
          <button className="text-indigo-600" onClick={() => handleToggleStatus(params.row.id)}>
            {params.row.accountStatus === "Active" ? "Deactivate" : "Activate"}
          </button>
          <button className="text-red-600" onClick={() => handleDelete(params.row.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  // ✅ Actions
  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this provider?")) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  function handleToggleStatus(id) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              accountStatus: r.accountStatus === "Active" ? "Inactive" : "Active",
            }
          : r
      )
    );
  }

  function handleAdd(newRow) {
    setRows((prev) => [{ id: Date.now().toString(), ...newRow }, ...prev]);
    setShowAdd(false);
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {/* 🔍 Search + Actions */}
      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0); // reset to first page when searching
          }}
          placeholder="Search by name, business, category, phone or city..."
          className="border px-3 py-2 rounded-md w-1/2"
        />
        <div className="flex gap-2">
          <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-md">
            Add SP
          </button>
          <button onClick={exportCSV} className="bg-slate-100 text-slate-800 px-4 py-2 rounded-md">
            Export CSV
          </button>
        </div>
      </div>

      {/* 🧭 Filters */}
      <ServiceProviderFiltersBar
        filters={filters}
        setFilters={(newFilters) => {
          setFilters(newFilters);
          setPage(0); // reset to first page when filters change
        }}
        categories={allCategories}
        statuses={allStatuses}
        locations={allLocations}
      />

      {/* 📋 DataGrid Table */}
      <div style={{ height: 600, width: "100%" }} className="mt-4">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id} // ensures unique row mapping
          pagination
          paginationMode="server"
          rowCount={rowCount}
          pageSize={pageSize}
          page={page}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => setPageSize(newSize)}
          loading={loading}
        />
      </div>

      {/* 🔸 Modals */}
      {showAdd && <AddSpModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {selected && <ViewSPModal provider={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
