import { CheckCircle, Clock, Star, Ticket } from "lucide-react";
import StatsCard from "./analyticsCard";
import TicketsByLocation from "./ticketsByLocation";

export default function SupportAnalytics({ticket}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        icon={
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Ticket size={18} className="text-gray-600" />
          </div>
        }
        value="245"
        label="Total Tickets"
        subtitle="+12.5% from last month"
        subtitleColor="text-green-600"
      />

      <StatsCard
        icon={
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <CheckCircle size={18} className="text-green-600" />
          </div>
        }
        value="89%"
        label="Resolution Rate"
        subtitle="+5.2% from last month"
        subtitleColor="text-green-600"
      />

      <StatsCard
        icon={
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Clock size={18} className="text-purple-600" />
          </div>
        }
        value="3.2h"
        label="Avg Resolution Time"
        subtitle="Industry standard: 4.5h"
        subtitleColor="text-gray-500"
      />

      <StatsCard
        icon={
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <Star size={18} className="text-orange-600" />
          </div>
        }
        value="4.7"
        label="Ratings"
        subtitle="Based on 189 ratings"
        subtitleColor="text-gray-500"
      />
      </div>
      <TicketsByLocation tickets={ticket} />

    </div>
  );
}
