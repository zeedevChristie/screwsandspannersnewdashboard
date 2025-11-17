import React from "react";

export default function Pagination({ page, totalPages, onChange }) {
  const prev = () => onChange(Math.max(1, page-1));
  const next = () => onChange(Math.min(totalPages, page+1));

  // simple page list with ellipsis if many pages
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2); 
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (end < totalPages) pages.push(totalPages);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-600">Page {page} of {totalPages}</div>
      <div className="flex gap-2 items-center">
        <button disabled={page===1} onClick={prev} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Prev</button>
        {pages.map((p, idx) => (
          <button
            key={idx}
            onClick={() => typeof p === "number" && onChange(p)}
            className={`px-3 py-1 text-sm border rounded ${p === page ? "bg-indigo-600 text-white" : ""} ${p==="..." ? "cursor-default" : ""}`}
            disabled={p === "..."}
          >
            {p}
          </button>
        ))}
        <button disabled={page===totalPages} onClick={next} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
