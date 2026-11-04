import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics"
import React, { useState, useMemo } from "react"

function readableTimestamp(value:any) {
  if (value === undefined || value === null || value === "") return ""

  const timestamp = String(value).trim()
  const numericTimestamp = /^\d+$/.test(timestamp) ? Number(timestamp) : timestamp
  const date = new Date(numericTimestamp)

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function downloadCSV(filename:any, rows:any) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(",")].concat(
    rows.map((r:any) =>
      headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )
  ).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function SearchStatistics() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState("")

  const thClass = "px-3 py-2 text-left font-semibold align-top whitespace-nowrap"
  const tdClass = "px-3 py-2 align-top whitespace-nowrap"
  const wrapTdClass = "px-3 py-2 align-top whitespace-normal break-words max-w-[320px]"

  const { data, isLoading, error } = useDashboardAnalytics(page,pageSize);

  const rows = data?.data ?? [];

  const pagination = data?.pagination;

  // SAFE GLOBAL FILTER
  const filtered = useMemo(() => {
    return rows.filter((row) => {
        const haystack = [
            row._id,
            row.search_key_words,
            row.selected_category_text,
            row.selected_category_id,
            row.search_address,
            row.user_unique_id,
            row.search_result_count,
            row.timestamp,
            row.selected_search_item?.firstname,
            row.selected_search_item?.lastname,
            row.selected_search_item?.business?.business_name,
        ]
            .join(" ")
            .toLowerCase();

        return haystack.includes(query.toLowerCase());
    });
  }, [rows, query]);

  if (isLoading) {
    return <div className="p-6">Loading search statistics...</div>;
  }
  
  if (error) {
    return (
      <div className="p-6 text-red-600">
        Failed to load search statistics.
      </div>
    );
  }

  function exportView() {
    const exportRows = filtered.map((row, index) => ({
      S_N: (page - 1) * pageSize + index + 1,
      ID: row._id,
      Keyword: row.search_key_words,
      CategoryText: row.selected_category_text,
      CategoryID: row.selected_category_id,
      Address: row.search_address,
      Longitude: row.search_address_geo?.longitude,
      Latitude: row.search_address_geo?.latitude,
      ResultCount: row.search_result_count,
      UserID: row.user_unique_id,
      Timestamp: readableTimestamp(row.timestamp),
      SearchID: row.selected_search_item?.id ?? "",
      CustomerName: `${row.selected_search_item?.firstname ?? ""} ${row.selected_search_item?.lastname ?? ""}`.trim(),
      Rating: row.selected_search_item?.rating ?? "",
    }));
  
    downloadCSV("search-statistics.csv", exportRows);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold  mb-2">Search Statistics</h2>

      <input
        type="text"
        placeholder="Search all fields..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-1/2"
      />

      <button
        onClick={exportView}
        className="bg-green-600 text-white px-3 py-2 rounded mb-4"
      >
        Export to CSV
      </button>

      <div className="w-full overflow-auto">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full min-w-max border border-gray-200 text-sm table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className={thClass}>S/N</th>
                <th className={thClass}>ID</th>
                <th className={thClass}>Keyword</th>
                <th className={thClass}>Category Text</th>
                <th className={thClass}>Category ID</th>
                <th className={thClass}>Address</th>
                <th className={thClass}>Longitude</th>
                <th className={thClass}>Latitude</th>
                <th className={thClass}>Result</th>
                <th className={thClass}>User ID</th>
                <th className={thClass}>Timestamp</th>
                <th className={thClass}>Search Id</th>
                <th className={thClass}>Customer's Name</th>
                <th className={thClass}>Rating</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-4 text-center text-gray-500">
                    No results found.
                  </td>
                </tr>
              )}

              {filtered.map((row, index) => {
                return (
                  <tr key={row._id} className="border-t border-gray-200">
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td className={tdClass}>{row._id}</td>
                    <td className={wrapTdClass}>{row.search_key_words}</td>
                    <td className={wrapTdClass}>{row.selected_category_text}</td>
                    <td className={tdClass}>{row.selected_category_id}</td>
                    <td className={wrapTdClass}>{row.search_address ?? "-"}</td>
                    <td className={tdClass}>{row.search_address_geo?.longitude ?? "-"}</td>
                    <td className={tdClass}>{row.search_address_geo?.latitude ?? "-"}</td>
                    <td className={tdClass}>{row.search_result_count}</td>
                    <td className={tdClass}>{row.user_unique_id}</td>
                    <td className={tdClass}>{readableTimestamp(row.timestamp)}</td>
                    <td className={wrapTdClass}>
                      {row.selected_search_item?.id ?? "-"}
                    </td>

                    <td className={wrapTdClass}>
                      {row.selected_search_item
                        ? `${row.selected_search_item.firstname} ${row.selected_search_item.lastname}`
                        : "-"}
                    </td>

                    <td className={tdClass}>
                      {row.selected_search_item?.rating ?? "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded border bg-white disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={() => setPage(p => Math.min(pagination?.total_pages ?? 1, p + 1))}
            disabled={page >= (pagination?.total_pages ?? 1)}
            className="px-3 py-2 rounded border bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <span>
        Page {page} of {pagination?.total_pages ?? 1} (Total records: {pagination?.total ?? 0})
        </span>

        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
            setPage(1)
          }}
          className="border rounded px-3 py-2"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>
    </div>
  )
}
