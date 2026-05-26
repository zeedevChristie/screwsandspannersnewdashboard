export default function StatusFilter() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <select className="border rounded-lg px-4 py-2 text-sm text-gray-600 w-full sm:w-44">
        <option>All Status</option>
        <option>Active</option>
        <option>Inactive</option>
      </select>

      <input
        type="text"
        placeholder="Search"
        className="border rounded-lg px-4 py-2 text-sm w-full sm:w-64"
      />
    </div>
  );
}
