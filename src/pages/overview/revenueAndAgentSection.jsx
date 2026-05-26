import AgentsCard from "./overviewComponents/agentsCard";
import RevenueBreakdownCard from "./overviewComponents/revenueBreakdownCard";


export default function RevenueAndAgentSection() {

  const revenueData = [
    { name: "Service Commissions", value: 450000 },
    { name: "Subscriptions", value: 150000 },
    { name: "Supplier Fees", value: 100000 },
  ];

  const agents = [
    { name: "Sarah Johnson", tickets: 18, oldest: "3 months" },
    { name: "Sarah Johnson", tickets: 12, oldest: "3 weeks" },
    { name: "Sarah Johnson", tickets: 8, oldest: "2 weeks" },
    { name: "Sarah Johnson", tickets: 8, oldest: "Today" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <RevenueBreakdownCard
        data={revenueData}
        total={650000}
      />
      <AgentsCard agents={agents} />
    </div>
  );
}