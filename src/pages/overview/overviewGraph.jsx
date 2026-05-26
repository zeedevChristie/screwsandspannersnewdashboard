import MonthlyGrowthCard from "./overviewComponents/monthlyGrowthCard";
import WeeklyRevenueCard from "./overviewComponents/weeklyRevenueCard";


export default function OverviewGraph() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <WeeklyRevenueCard />
      <MonthlyGrowthCard />
    </div>
  );
}