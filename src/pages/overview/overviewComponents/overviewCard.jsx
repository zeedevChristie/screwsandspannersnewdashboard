export default function OverviewCard({
  icon,
  title,
  value,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-2xl p-3 shadow-sm hover:shadow-md transition cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          {icon}
        </div>

        <span className="text-gray-400 text-sm">↗</span>
      </div>

      <p className="text-gray-500 text-sm mb-2">{title}</p>
      <h2 className="text-2xl font-semibold text-gray-800">{value}</h2>
    </div>
  );
}