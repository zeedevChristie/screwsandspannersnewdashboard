import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Beauty", value: 32, color: "#ef4444" },
  { name: "Plumbing", value: 26, color: "#f97316" },
  { name: "Electrical", value: 20, color: "#eab308" },
  { name: "Cleaning", value: 14, color: "#22c55e" },
  { name: "Others", value: 9, color: "#6366f1" },
];

export default function CategoryDistributionCard() {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Category Distribution</h3>
      <p className="text-sm text-gray-500 mb-4">
        Service requests by category
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              outerRadius={90}
              label={({ name, value }) => `${name} ${value}%`}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}