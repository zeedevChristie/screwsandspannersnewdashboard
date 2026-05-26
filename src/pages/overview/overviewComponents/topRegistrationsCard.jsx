import { MapPin } from "lucide-react";
import StatRow from "./statRow";
import OverviewTopCard from "./overviewTopCard";

export default function TopRegistrationsCard({ data }) {
  return (
    <OverviewTopCard
      title="Top Registrations"
      subtitle="Latest sign-ups across all categories"
    >
      <div className="space-y-6">
        {data.map((item, index) => (
          <StatRow
            key={index}
            icon={<MapPin size={16} className="text-gray-500" />}
            label={item.name}
            value={item.value}
            percentage={item.percentage}
            barColor="bg-green-700"
            trackColor="bg-green-100"
          />
        ))}
      </div>
    </OverviewTopCard>
  );
}