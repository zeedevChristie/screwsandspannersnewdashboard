import { MapPin } from "lucide-react";

export default function TicketsByLocation() {
  const locations = [
    { name: "Lagos", count: 52 },
    { name: "Abuja", count: 48 },
    { name: "Port Harcourt", count: 35 },
    { name: "Yaba, Lagos", count: 28 },
    { name: "Surulere, Lagos", count: 22 },
  ];

  return (
    <div className="bg-white border rounded-2xl shadow-sm p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Tickets by Location
      </h2>

      {/* List */}
      <div className="space-y-5">
        {locations.map((location, index) => (
          <div
            key={index}
            className="flex items-center justify-between"
          >
            {/* Left side (icon + name) */}
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-gray-400" />
              <span className="text-gray-700 font-medium">
                {location.name}
              </span>
            </div>

            {/* Right side (count) */}
            <span className="text-gray-800 font-semibold">
              {location.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}