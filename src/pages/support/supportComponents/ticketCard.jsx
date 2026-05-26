export function TicketCard({ ticket, onClick }) {
  const priorityColor = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-orange-100 text-orange-600",
    Low: "bg-green-100 text-green-600",
  }[ticket.priority];

  return (
    <div
      onClick={() => onClick(ticket)}
      className="bg-white p-4 w-full rounded-xl shadow-sm border hover:shadow-md cursor-pointer min-w-0"
    >
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="truncate pr-2">{ticket.id}</span>
        <span className="px-2 bg-gray-100 rounded-xl max-w-[11rem] truncate">
          {ticket.category}
        </span>
      </div>

      <h4 className="font-semibold text-sm mb-1 break-words">{ticket.subject}</h4>

      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-500">{ticket.name}</span>

      </div>  
        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor}`}>
          {ticket.priority}
        </span>

      <div className="text-xs text-gray-400 mt-1">{ticket.time}</div>
    </div>
  );
}
