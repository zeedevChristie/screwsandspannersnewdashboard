// ReportsHistory.jsx
import { useNavigate } from "react-router-dom";

export default function ReportsHistory() {
  const navigate = useNavigate();

  const modules = [
    { name: "Customers", path: "/service-delivery" },
    { name: "Service Providers", path: "/service-delivery" },
    { name: "Job Orders", path: "/service-delivery" },
  ];

  // Example saved reports
  const savedReports = [
    { name: "New Customers - Today", link: "C:\\Users\\Christie\\OneDrive\\Documents\\ScrewsAndSpanners" },
    { name: "Job Orders - Month", link: "C:\\Users\\Christie\\OneDrive\\Documents\\ScrewsAndSpanners" },
  ];

  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="font-bold mb-2">Modules</h2>
      <select
        className="w-full border p-2 rounded mb-4"
        onChange={(e) => navigate(e.target.value)}
      >
        <option value="">Select Module</option>
        {modules.map((m) => (
          <option key={m.path} value={m.path}>
            {m.name}
          </option>
        ))}
      </select>

      <h2 className="font-bold mb-2">Saved Reports</h2>
      <ul className="space-y-2">
        {savedReports.map((r, i) => (
          <li key={i}>
            <a href={r.link} className="text-blue-600 hover:underline">
              {r.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
