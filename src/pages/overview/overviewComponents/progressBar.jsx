export default function ProgressBar({
  percentage,
  color = "bg-red-600",
  trackColor = "bg-red-100",
}) {
  return (
    <div className={`w-full ${trackColor} rounded-full h-2`}>
      <div
        className={`${color} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}