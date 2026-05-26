import ProgressBar from "./progressBar";

export default function StatRow({
  icon,
  label,
  value,
  percentage,
  change,
  barColor,
  trackColor,
}) {
  const isPositive = change >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              {icon}
            </div>
          )}
          <span className="font-medium text-gray-700">{label}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 font-medium">
            {value.toLocaleString()}
          </span>

          {change !== undefined && (
            <span
              className={`font-medium ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
          )}
        </div>
      </div>

      <ProgressBar
        percentage={percentage}
        color={barColor}
        trackColor={trackColor}
      />
    </div>
  );
}