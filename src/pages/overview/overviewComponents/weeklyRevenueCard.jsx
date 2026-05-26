import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", revenue: 85000 },
  { day: "Tue", revenue: 90000 },
  { day: "Wed", revenue: 78000 },
  { day: "Thu", revenue: 105000 },
  { day: "Fri", revenue: 120000 },
  { day: "Sat", revenue: 145000 },
  { day: "Sun", revenue: 125000 },
];

export default function WeeklyRevenueCard() {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Weekly Revenue Overview</h3>
          <p className="text-sm text-gray-500">
            Revenue and order trends for the past 7 days
          </p>
        </div>
        <button className="text-red-500 text-sm font-medium">
          View Details
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#ef4444"
              fill="#fecaca"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}