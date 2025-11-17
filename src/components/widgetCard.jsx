export default function WidgetCard({ title, value, subValue, bg }) {
  // Safe Tailwind background + hover color mapping
  const bgColorMap = {
    "blue": "bg-blue-600 hover:bg-blue-300",
    "yellow": "bg-yellow-400 hover:bg-yellow-300",
    "green": "bg-green-600 hover:bg-green-300",
    "purple": "bg-purple-600 hover:bg-purple-300",
    "red": "bg-red-600 hover:bg-red-300",
    "amber": "bg-amber-600 hover:bg-gray-300",
  };

  return (
    <div
      className={`rounded-xl p-3 shadow-sm border text-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md cursor-pointer ${
        bgColorMap[bg] || "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <p className="text-sm font-medium">{title}</p>
      <h2 className="text-xl font-bold mt-1">{value}</h2>
      <p className="text-xs font-medium">{subValue}</p>
    </div>
  );
}
