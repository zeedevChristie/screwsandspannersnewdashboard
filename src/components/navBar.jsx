import { Search, Bell, ChevronDown } from "lucide-react";

export default function Navbar() {
  return (
    <header className="flex justify-between items-center px-6 py-4 border-b bg-white">
      <div>
        <h2 className="text-xl font-semibold">Dashboards</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <Bell className="text-gray-600 cursor-pointer" />
      </div>
    </header>
  );
}
