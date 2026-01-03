import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Switch } from "@mui/material";
import ViewSPModal from "./viewSpModal";

export default function ServiceProviders() {
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // FILTER STATES

  const [searchTerm, setSearchTerm] = useState("");
  //   const [selectedCategory, setSelectedCategory] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // FILTER LOGIC

  useEffect(() => {
    let temp = [...rows];

    if (searchTerm.trim()) {
      temp = temp.filter((r) =>
        [
          r.firstname,
          r.lastname,
          r.fullName,
          r.email,
          r.phone,
          r.categories_titles,
          r.city,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (startDate) {
      temp = temp.filter((r) => new Date(r.created_at) >= new Date(startDate));
    }

    if (endDate) {
      temp = temp.filter((r) => new Date(r.created_at) <= new Date(endDate));
    }

    setFilteredRows(temp);
  }, [searchTerm, startDate, endDate, rows]);

  //EXPORT FUNCTIONS

  function exportCSVsheet(dataToExport) {
    const header =
      "id,name,email,businessName,categories,phone,city,accountStatus,completedOrders,verification,createdAt\n";

    const lines = dataToExport.map((r) => {
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

    const csvContent = header + lines.join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "service_providers.csv";
    link.click();
  }

  //DATAGRID COLUMNS

  const columns = [
    {
      field: "avatar_location",
      headerName: "Profile",
      width: 80,
      headerAlign: "center",
      renderCell: (params) =>
        params.value ? (
          <img
            src={`https://app.api.screwsandspanners.com/${params.value}`}
            alt="avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : null,
    },
    {
      field: "firstname",
      headerName: "First name",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "lastname",
      headerName: "Last name",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "fullName",
      headerName: "Full name",
      width: 200,
      headerAlign: "center",
    },
    { field: "email", headerName: "Email", width: 200, headerAlign: "center" },
    {
      field: "created_at",
      headerName: "Signup Date",
      width: 200,
      headerAlign: "center",
    },
    {
      field: "business_name",
      headerName: "Business Name",
      width: 200,
      headerAlign: "center",
    },
    {
      field: "categories_titles",
      headerName: "Categories",
      width: 220,
      headerAlign: "center",
    },
    { field: "phone", headerName: "Phone", width: 150, headerAlign: "center" },
    {
      field: "address",
      headerName: "Address",
      width: 240,
      headerAlign: "center",
    },
    {
      field: "job_taken",
      headerName: "Job Taken",
      width: 100,
      headerAlign: "center",
    },
    {
      field: "completed_jobs",
      headerName: "Completed Jobs",
      width: 150,
      headerAlign: "center",
    },
    {
      field: "verification",
      headerName: "Verification Status",
      width: 160,
      headerAlign: "center",
      renderCell: ({ value, row }) => {
        const rowId = row.id;
        const handleChange = async (e) => {
          const newStatus = e.target.value;

          setRows((prev) =>
            prev.map((r) =>
              r.id === rowId ? { ...r, verification: newStatus } : r
            )
          );

          try {
            const token = localStorage.getItem("authToken");

            const res = await fetch(
              `https://app.api.screwsandspanners.com/api/v1/auth/verify-user/${rowId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`, // ✅ attach token
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ verification: newStatus }),
              }
            );

            res.ok
              ? toast.success(`User ${rowId} verified as ${newStatus}`)
              : toast.error(`Failed to update verification`);
          } catch (err) {
            toast.error("Network error");
          }
        };

        return (
          <select value={value} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        );
      },
    },

    // --- BADGES ---
    {
      field: "badges",
      headerName: "Badges",
      width: 380,
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => {
        const rowId = params.row.id;
        const badgeEnabled = params.row.badgeEnabled;
        const badgeStart = params.row.badgeStart || "";
        const badgeEnd = params.row.badgeEnd || "";

        const updateRow = (patch) => {
          setRows((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
          );
        };

        const handleToggle = async (e) => {
          const checked = e.target.checked;
          updateRow({ badgeEnabled: checked });

          try {
            const token = localStorage.getItem("authToken");

            await fetch(
              `https://app.api.screwsandspanners.com/api/v1/auth/update-badge/${rowId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`, // ✅ attach token
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  badgeEnabled: checked,
                  badgeStart,
                  badgeEnd,
                }),
              }
            );
            toast.success(`Badge ${checked ? "enabled" : "disabled"}`);
          } catch {
            toast.error("Failed to update badge");
          }
        };

        const handleDateChange = async (field, value) => {
          updateRow({ [field]: value });

          try {
            const token = localStorage.getItem("authToken");

            await fetch(
              `https://app.api.screwsandspanners.com/api/v1/auth/update-badge/${rowId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`, // ✅ attach token
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  badgeEnabled,
                  badgeStart: field === "badgeStart" ? value : badgeStart,
                  badgeEnd: field === "badgeEnd" ? value : badgeEnd,
                }),
              }
            );
            toast.success(`Badge ${field} updated`);
          } catch {
            toast.error("Failed to update badge date");
          }
        };

        return (
          <div>
            <label>
              <input
                type="checkbox"
                checked={badgeEnabled}
                onChange={handleToggle}
              />
              Enable Badge
            </label>
            <input
              type="date"
              value={badgeStart}
              onChange={(e) => handleDateChange("badgeStart", e.target.value)}
            />
            <input
              type="date"
              value={badgeEnd}
              onChange={(e) => handleDateChange("badgeEnd", e.target.value)}
            />
          </div>
        );
      },
    },

    // --- ACTIONS ---
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      headerAlign: "center",
      sortable: false,
      renderCell: ({ row }) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setSelectedRow(row);
              setIsEditing(false);
              setOpenModal(true);
            }}
          >
            View
          </button>
          <button
            onClick={() => {
              setSelectedRow(row);
              setIsEditing(true);
              setOpenModal(true);
            }}
          >
            Edit
          </button>
        </div>
      ),
    },
  ];

  // FETCH DATA

  useEffect(() => {
    setLoading(true);

    fetch("https://app.api.screwsandspanners.com/api/v1/auth/sp-stats")
      .then((response) => response.json())
      .then((data) => {
        const flattenedRows = (data.data.serviceProviders || []).map((row) => ({
          ...row,
          business_name: row.business?.business_name || "",
          categories_titles: Array.isArray(row.categories)
            ? row.categories.map((c) => c.title).join(", ")
            : "",
          fullName: `${row.firstname || ""} ${row.lastname || ""}`,
          address: row.business?.business_address || "",
          job_taken: row.business?.job_taken || 0,
          completed_jobs: row.business?.job_completed || 0,
          badgeEnabled: Boolean(row.badgeEnabled ?? false),
          badgeStart: row.badgeStart ?? "",
          badgeEnd: row.badgeEnd ?? "",
        }));

        setRows(flattenedRows);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load service providers");
        setLoading(false);
      });
  }, []);

  return (
    <>
      {/* filter */}
      <div className=" mb-4 flex  gap-3 items-center">
        <input
          type="text"
          className="border p-2 rounded w-52"
          placeholder="Search name, email, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        {/* EXPORT BUTTONS */}
        <button
          onClick={() =>
            exportCSVsheet(filteredRows.length ? filteredRows : rows)
          }
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Export Filtered
        </button>

        <button
          onClick={() => exportCSVsheet(rows)}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Export All
        </button>
      </div>

      {/* TABLE */}
      <Box sx={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={filteredRows.length ? filteredRows : rows}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeight={60}
          pagination
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
        />
      </Box>

      {/* MODAL */}
      <ViewSPModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        row={selectedRow}
        isEditing={isEditing}
        onChange={(patch) => setSelectedRow((prev) => ({ ...prev, ...patch }))}
        onSave={async () => {
          if (!selectedRow) return;

          try {
            const res = await fetch(
              `https://app.api.screwsandspanners.com/api/v1/auth/update-user/${selectedRow.id}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fullName: selectedRow.fullName,
                  email: selectedRow.email,
                  phone: selectedRow.phone,
                  business_name: selectedRow.business_name,
                }),
              }
            );

            if (res.ok) {
              setRows((prev) =>
                prev.map((r) =>
                  r.id === selectedRow.id ? { ...r, ...selectedRow } : r
                )
              );

              toast.success("Profile updated successfully");
              setOpenModal(false);
            } else {
              toast.error("Failed to update profile");
            }
          } catch {
            toast.error("Network error while saving profile");
          }
        }}
      />
    </>
  );
}
