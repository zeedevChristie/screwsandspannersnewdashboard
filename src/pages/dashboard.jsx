import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import WidgetCard from "../components/widgetCard";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [counts, setCounts] = useState({});

  // Fetch statistics from Screws & Spanners API
useEffect(() => {
  fetch("https://app.api.screwsandspanners.com/api/v1/auth/statistics")
    .then((response) => response.json())
    .then((data) => {
      setCounts(data);
    })
    .catch((error) => console.error("Error fetching data:", error));
}, []);

  const widgets = [
    {
      title: "Active Users",
      value: counts.totalActiveUsers,
      subValue: `Total Registered: ${counts.totalRegistrations}`,
      bg: "amber",
    },
    {
      title: "Active SPs",
      value: counts.activeServiceProviders,
      subValue: "Total SP: ",
      bg: "blue",
    },
    {
      title: "Active Customers",
      value: counts.activeCustomers,
      subValue: "Total Customers: ",
      bg: "purple",
    },
    {
      title: "Active Suppliers",
      value: counts.activeSuppliers,
      subValue: "Total Suppliers: ",
      bg: "yellow",
    },
    {
      title: "Revenue",
      value: "₦",
      subValue: "Total Revenue: ₦",
      bg: "green",
    },
    {
      title: "Tickets",
      value: " ",
      subValue: "All Tickets: ",
      bg: "red",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Hello tmak</h1>
          <p className="text-sm text-gray-500 mb-">Lorem ipsum dolor</p>
        </div>

        <div className="flex items-center gap-3">
          {/* filter button */}
          {/* <button className="border px-3 py-2 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50 transition">
            This month <ChevronDown size={16} />
          </button> */}

          {/* Widget toggle icon */}
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="border p-2 rounded-lg hover:bg-gray-50 transition"
            title={isOpen ? "Hide Widgets" : "Show Widgets"}
          >
            {isOpen ? <ChevronUp size={18} /> : <LayoutGrid size={18} />}
          </button>
        </div>
      </div>

      {/* Collapsible widget grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 overflow-hidden transition-all duration-500 ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {widgets.map((item, index) => (
          <WidgetCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
