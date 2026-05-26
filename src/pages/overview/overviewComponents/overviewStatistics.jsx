import {
  Users,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import OverviewCard from "./overviewCard";

export default function OverviewStatistics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <OverviewCard
        icon={<Users size={18} className="text-orange-600" />}
        title="Unfulfilled searches"
        value="24"
      />

      <OverviewCard
        icon={<CheckCircle size={18} className="text-orange-600" />}
        title="Active Jobs"
        value="156"
      />

      <OverviewCard
        icon={<AlertCircle size={18} className="text-orange-600" />}
        title="Open Tickets"
        value="35"
      />

      <OverviewCard 
        icon={<DollarSign size={18} className="text-orange-600" />}
        title="Today's Revenue"
        value="₦28,500"
      />
    </div>
  );
}