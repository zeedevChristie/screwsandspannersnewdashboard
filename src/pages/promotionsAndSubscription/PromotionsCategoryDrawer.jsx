export default function PromotionsCategoryDrawer({ open, onClose }) {
  if (!open) return null;

  const categories = [
    "Subscriptions",
    "Technology",
    "Consultation",
    "Food Delivery",
    "Salon",
    "Badge Admin",
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[360px] bg-white shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Search Categories</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto">
        <input
          placeholder="Search Categories"
          className="w-full border rounded-lg px-4 py-2 text-sm"
        />

        {categories.map((cat, i) => (
          <label
            key={i}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
          >
            <input type="checkbox" />
            <span className="text-sm">{cat}</span>
          </label>
        ))}
      </div>

      <div className="p-4 border-t">
        <button className="w-full bg-gray-900 text-white py-2 rounded-lg">
          Add Selections
        </button>
      </div>
    </div>
  );
}
