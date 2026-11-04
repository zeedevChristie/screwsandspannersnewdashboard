import { useUserAnalytics } from "@/hooks/useUserAnalytics";

import GrowthChart from "@/components/charts/growthChart";
import RevenueChart from "@/components/charts/revenueChart";

/* The two dashboard charts side by side.
   On smaller screens they stack one under the other. */
export default function OverviewGraph() {
  const { dailyRevenue, growth, isLoading, error, reload } = useUserAnalytics();

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <RevenueChart
        daily={dailyRevenue}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
      />

      <GrowthChart growth={growth} isLoading={isLoading} error={error} onRetry={reload} />
    </div>
  );
}