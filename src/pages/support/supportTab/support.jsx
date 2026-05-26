import { useState, useMemo } from "react";
import { BarChart2, Plus, Search } from "lucide-react";
import { TicketCard } from "../supportComponents/ticketCard";
import { TicketModal } from "../supportComponents/ticketModal";
import { AddTicketModal } from "../supportComponents/addTicketModal";
import Dashboard from "../../dashboard";
import SupportAnalytics from "../supportComponents/supportAnalytics";

export default function SupportTab() {
  const [tickets, setTickets] = useState([
    { id: "TKT-2026-00001", status: "Inbox", name: "John Doe", subject: "Service provider delayed - washing machine repair", priority: "High", time: "1h 30m", category: "Service Request" ,text:"Message sent by customer", customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00002", status: "Inbox", name: "John Doe", subject: "Service provider delayed - washing machine repair", priority: "High", time: "1h 30m", category: "Service Request", text:"Message sent by customer", customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Port-Harcourt", },
    { id: "TKT-2026-00003", status: "Inbox", name: "John Doe", subject: "Service provider delayed - washing machine repair", priority: "High", time: "1h 30m", category: "Service Request",text:"Message sent by customer" , customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00004", status: "New", name: "Ahmed Hassan", subject: "Cannot login to mobile app", priority: "High", time: "25m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00005", status: "New", name: "Ahmed Hassan", subject: "Cannot login to mobile app", priority: "High", time: "25m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", }, 
    { id: "TKT-2026-00006", status: "New", name: "Ahmed Hassan", subject: "Cannot login to mobile app", priority: "High", time: "25m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00007", status: "New", name: "Ahmed Hassan", subject: "Cannot login to mobile app", priority: "High", time: "25m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00008", status: "Open", name: "David Chen", subject: "Promo code SAVE20 not working", priority: "Low", time: "1h 45m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00009", status: "Open", name: "David Chen", subject: "Promo code SAVE20 not working", priority: "Low", time: "1h 45m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Surulere", },
    { id: "TKT-2026-00010", status: "Open", name: "David Chen", subject: "Promo code SAVE20 not working", priority: "Low", time: "1h 45m", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00011", status: "Resolved", name: "Jane Smith", subject: "Billing discrepancy on last invoice", priority: "Medium", time: "19h", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00012", status: "Resolved", name: "Jane Smith", subject: "Billing discrepancy on last invoice", priority: "Medium", time: "19h", category: "Authentication",text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Lagos", },
    { id: "TKT-2026-00013", status: "Disputes", name: "Grace Okafor", subject: "Service provider was rude and unprofessional", priority: "High", time: "1d 17h", category: "Authentication" ,text:"Message sent by customer",customer:"Customer", agent:"Agent",email: "john.doe@email.com", phone: "+234 801 234 5678", location: "Abuja"},
  ]);
  const [search, setSearch] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

const statuses = ["Inbox", "New", "Open", "Resolved", "Disputes"];


  const filtered = useMemo(
    () =>
      tickets.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [tickets, search],
  );

  if (showAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-between p-6">
          <h1 className="text-2xl font-bold">Support Analytics</h1>
          <button
            onClick={() => setShowAnalytics(false)}
            className="border px-4 py-2 rounded-lg"
          >
            View Tickets
          </button>
        </div>
       <SupportAnalytics/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray">
      <Dashboard/>
      <div className="flex justify-between items-center my-2">
        <h1 className="text-2xl font-bold">Support</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus size={16} /> Add New Ticket
          </button>
          <button
            onClick={() => setShowAnalytics(true)}
            className="border px-4 py-2 rounded-lg flex items-center gap-1"
          >
            <BarChart2 size={16} /> View Analytics
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-white border rounded-lg px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input
          className="w-full outline-none"
          placeholder="Search tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex overflow-auto  px- rounded-lg gap-1">
        {statuses.map((status) => (
          <div key={status} className="bg-gray-100 border-2 rounded-xl p-">
            <div className="flex justify-between items-center mb- text-white p-2 rounded-t-xl  bg-gray-800">
              <h3 className="font mb-2">{status}</h3>
              <h3 className="font mb-2">count</h3>
            </div>
            <div className="space-y-3 p-2 ">
              {filtered
                .filter((t) => t.status === status)
                .map((t) => (
                  <TicketCard key={t.id} ticket={t} onClick={setActiveTicket} />
                ))}
            </div>
          </div>
        ))}
      </div>

      <TicketModal
        ticket={activeTicket}
        onClose={() => setActiveTicket(null)}
      />
      <AddTicketModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={(t) =>
          setTickets([
            ...tickets,
            {
              ...t,
              id: `TKT-${Date.now()}`,
              status: "New",
              time: "just now",
              category: "General",
            },
          ])
        }
      />
    </div>
  );
}
