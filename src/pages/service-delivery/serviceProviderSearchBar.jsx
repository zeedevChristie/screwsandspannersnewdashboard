import React from "react";

export default function ServiceProviderSearchBar({ value, onChange }) {
  return (
    <div className="mt-4 flex justify-end">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name, business, category, phone or city..."
        className="w-full md:w-1/3 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
