
import { Box } from "lucide-react";
import StatRow from "./statRow";
import OverviewTopCard from "./overviewTopCard";

export default function TopCategoriesCard({ data }) {
  return (
    <OverviewTopCard
      title="Top Categories"
      subtitle="By service requests"
    >
      <div className="space-y-6">
        {data.map((item, index) => (
          <StatRow
            key={index}
            icon={<Box size={16} className="text-gray-500" />}
            label={item.name}
            value={item.value}
            percentage={item.percentage}
            change={item.change}
            barColor="bg-red-600"
            trackColor="bg-red-100"
          />
        ))}
      </div>
    </OverviewTopCard>
  );
}