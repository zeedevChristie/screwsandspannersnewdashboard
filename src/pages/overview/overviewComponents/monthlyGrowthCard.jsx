import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", customers: 1200, providers: 500 },
  { month: "Feb", customers: 1400, providers: 550 },
  { month: "Mar", customers: 1600, providers: 600 },
  { month: "Apr", customers: 1900, providers: 650 },
  { month: "May", customers: 2100, providers: 700 },
  { month: "Jun", customers: 2500, providers: 750 },
];

export default function MonthlyGrowthCard() {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Monthly Growth Trends</h3>
        <p className="text-sm text-gray-500">
          Customer and provider growth over 6 months
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="providers"
              stroke="#22c55e"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}