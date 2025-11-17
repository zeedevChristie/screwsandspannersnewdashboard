import { useState, useEffect } from "react";

export default function ServiceProviderFiltersBar({ data = [], onFilter }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // ✅ Derive unique options safely
  const categories = ["All", ...Array.from(new Set(
    (data || []).map((sp) => sp?.category).filter(Boolean)
  ))];

  const statuses = ["All", ...Array.from(new Set(
    (data || []).map((sp) => sp?.accountStatus).filter(Boolean)
  ))];

  // ✅ Notify parent on filter change
  useEffect(() => {
    if (typeof onFilter === "function") {
      onFilter({
        category: selectedCategory,
        status: selectedStatus,
      });
    }
  }, [selectedCategory, selectedStatus, onFilter]);

  // ✅ Reset filters
  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center bg-white p-3 rounded-lg shadow-sm border">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600">Status:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map((s, i) => (
            <option key={i} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Button */}
      <button
        onClick={clearFilters}
        className="ml-auto text-xs px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 transition"
      >
        Clear Filters
      </button>
    </div>
  );
}
