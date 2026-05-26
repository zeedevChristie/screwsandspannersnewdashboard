export default function PromoFilters() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <select className="border rounded-lg px-4 py-2 text-sm w-full sm:w-44">
        <option>All Status</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>

      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder="Search"
          className="border rounded-lg pl-10 pr-4 py-2 text-sm w-full"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>
    </div>
  );
}
