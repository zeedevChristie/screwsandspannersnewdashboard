const locations = [
  { name: "Lagos", value: 3240 },
  { name: "Abuja", value: 1850 },
  { name: "Port Harcourt", value: 1120 },
  { name: "Ibadan", value: 890 },
  { name: "Others", value: 520 },
];

const maxValue = Math.max(...locations.map((l) => l.value));

export default function TopLocationsCard() {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Top Locations</h3>
      <p className="text-sm text-gray-500 mb-4">
        Active subscribers by geographic location
      </p>

      <div className="space-y-4">
        {locations.map((loc, index) => {
          const percentage = (loc.value / maxValue) * 100;

          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{loc.name}</span>
                <span className="font-medium">
                  {loc.value.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-red-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}