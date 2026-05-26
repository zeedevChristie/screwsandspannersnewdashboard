import React from "react";
import { Users, CheckCircle, Package, TrendingUp } from "lucide-react";
import ActivityCard from "./overviewComponents/activityCard";

export default function ActivityOverview() {

  const stats = [
    {
      icon: <Users size={24} />,
      value: "2,340",
      label: "Active Sessions",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: <CheckCircle size={24} />,
      value: "856",
      label: "Completed Jobs",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      icon: <Package size={24} />,
      value: "1,234",
      label: "Service Requests",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: <TrendingUp size={24} />,
      value: "92%",
      label: "Job Success Rate",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800">
          Activity Overview
        </h2>
        <p className="text-sm text-gray-500">
          User engagement metrics for this month
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((item, index) => (
          <ActivityCard key={index} {...item} />
        ))}
      </div>

    </div>
  );
}