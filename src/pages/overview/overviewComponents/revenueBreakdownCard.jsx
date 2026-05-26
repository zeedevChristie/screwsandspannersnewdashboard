import { DollarSign } from "lucide-react";
import RevenueAndAgentsCard from "./revenueAndAgentsCard";
import HorizontalBarChart from "./horizontalBarChart";

export default function RevenueBreakdownCard({ data, total }) {
  return (
    <RevenueAndAgentsCard
      title="Revenue Breakdown"
      subtitle="This month's revenue sources"
      action={
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <DollarSign className="text-purple-600" size={18} />
        </div>
      }
      footer={
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Revenue</span>
          <span className="font-semibold text-gray-800">
            ₦{total.toLocaleString()}
          </span>
        </div>
      }
    >
      <HorizontalBarChart data={data} />
    </RevenueAndAgentsCard>
  );
}