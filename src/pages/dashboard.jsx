import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import WidgetCard from "../components/widgetCard";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState(null); // Added for better error visibility

  // Fetch statistics from Screws and Spanners API endpoints
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("authToken");
      console.log("Retrieved token:", token); // Enhanced log for debugging

      if (!token) {
        console.error("No auth token found");
        setError("No auth token found in localStorage");
        return;
      }

      try {
        const response = await fetch("https://app.api.screwsandspanners.com/api/v1/auth/statistics", {
          method: "GET", // Explicitly set to GET for clarity (default, but good practice)
          headers: {
            "Authorization": `Bearer ${token}`,
            // Removed "Content-Type": "application/json" – not needed for GET requests without body
          }
        });

        console.log("Full response object:", response); // Log the Response object for status/headers

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Key addition: Log the actual data to debug what's returned
        setCounts(data);
        setError(null); // Clear any previous error
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(`Failed to fetch data: ${error.message}`); // Set error state for UI feedback
      }
    };

    fetchData();
  }, []);

  // Optional: Render error if any (you can style this or integrate into UI)
  if (error) {
    console.error("Fetch error:", error); // Already logged, but visible in console
    // You could add a UI element here, e.g., <div className="text-red-500">{error}</div>
  }

  const widgets = [
    {
      title: "Active Users",
      value: counts.totalActiveUsers || 0,
      subValue: `Total Registered: ${counts.totalRegistrations || 0}`,
      bg: "amber",
    },
    {
      title: "Active SPs",
      value: counts.serviceProviders?.active || 0,
      subValue: `Total SP: ${counts.serviceProviders?.total || 0}`,
      bg: "blue",
    },
    {
      title: "Active Customers",
      value: counts.customers?.active || 0,
      subValue: `Total Customers: ${counts.customers?.total || 0}`,
      bg: "purple",
    },
    {
      title: "Active Suppliers",
      value: counts.activeSuppliers || 0,
      subValue: `Total Suppliers: ${counts.totalSuppliers || 0}`, // Fixed: Assumed API has totalSuppliers; adjust if different (e.g., counts.suppliers?.total)
      bg: "yellow",
    },
    {
      title: "Revenue",
      value: counts.revenue ? `₦${counts.revenue.toLocaleString()}` : "₦0", // Placeholder fix: Assumed API has revenue; format for currency
      subValue: counts.totalRevenue ? `Total Revenue: ₦${counts.totalRevenue.toLocaleString()}` : "Total Revenue: ₦0",
      bg: "green",
    },
    {
      title: "Tickets",
      value: counts.totalTickets || 0, // Placeholder fix: Assumed API has totalTickets or similar
      subValue: counts.allTickets ? `All Tickets: ${counts.allTickets}` : "All Tickets: 0",
      bg: "red",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Hello tmak</h1>
          <p className="text-sm text-gray-500 mb-4">Lorem ipsum dolor</p> {/* Fixed: Added '4' to mb- class */}
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