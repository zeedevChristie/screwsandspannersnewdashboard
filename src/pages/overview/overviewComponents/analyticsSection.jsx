import CategoryDistributionCard from "./categoryDistributionCard";
import ServiceStatusCard from "./serviceStatusCard";
import TopLocationsCard from "./topLocationsCard";


export default function AnalyticsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CategoryDistributionCard />
      <ServiceStatusCard />
      <TopLocationsCard />
    </div>
  );
}