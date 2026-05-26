export default function StatsCard({
  icon,
  value,
  label,
  subtitle,
  subtitleColor = "text-gray-500",
}) {
  return (
    <div className="bg-white rounded-2xl border 
                    p-6 shadow-sm 
                    hover:shadow-md transition">
      
      {/* Icon */}
      <div className="mb-4">
        {icon}
      </div>

      {/* Value */}
      <h2 className="text-3xl font-bold text-gray-900">
        {value}
      </h2>

      {/* Label */}
      <p className="text-gray-600 mt-1">
        {label}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-sm mt-2 ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
