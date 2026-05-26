export default function AgentRow({
  name,
  tickets,
  oldest,
}) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
      
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
          {name.charAt(0)}
        </div>
        <span className="font-medium text-gray-800">
          {name}
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">
          {tickets} Tickets
        </span>

        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium">
          Oldest {oldest}
        </div>
      </div>
    </div>
  );
}