import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import WidgetCard from "../components/widgetCard";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [counts, setCounts] = useState({});

  // Fetch statistics from Screws and Spanners API endpoints
useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    console.log(token);

    if (!token) {
      console.error("No auth token found");
      return;
    }

    try {
      const response = await fetch("https://app.api.screwsandspanners.com/api/v1/auth/statistics", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log(response);
      const data = await response.json();
      setCounts(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
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
      value: counts.serviceProviders?.active,
      subValue: `Total SP:${counts.serviceProviders?.total}`,
      bg: "blue",
    },
    {
      title: "Active Customers",
      value: counts.customers?.active,
      subValue: `Total Customers: ${counts.customers?.total}`,
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
