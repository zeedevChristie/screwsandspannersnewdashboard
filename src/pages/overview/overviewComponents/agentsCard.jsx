import AgentRow from "./agentRow";
import RevenueAndAgentsCard from "./revenueAndAgentsCard";


export default function AgentsCard({ agents }) {
  return (
    <RevenueAndAgentsCard
      title="Agents with Open Tickets"
      subtitle="Admin users with highest number of open tickets"
      action={
        <button className="text-red-600 text-sm font-medium">
          View All
        </button>
      }
    >
      <div className="space-y-4">
        {agents.map((agent, index) => (
          <AgentRow
            key={index}
            name={agent.name}
            tickets={agent.tickets}
            oldest={agent.oldest}
          />
        ))}
      </div>
    </RevenueAndAgentsCard>
  );
}