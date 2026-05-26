export default function PromoUsageBar({ used, total }) {
  const percent = (used / total) * 100;

  return (
    <div className="space-y-1 min-w-[140px]">
      <div className="w-full h-2 bg-gray-100 rounded-full">
        <div
          style={{ width: `${percent}%` }}
          className="h-2 rounded-full bg-red-400 transition-all"
        />
      </div>

      <p className="text-xs text-gray-500 text-right">
        {used}/{total}
      </p>
    </div>
  );
}
