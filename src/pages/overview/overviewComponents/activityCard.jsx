import React from "react";

export default function ActivityCard({ icon, value, label, bgColor, iconColor }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 p-4">
      
      {/* Icon Circle */}
      <div className={`w-14 h-14 flex items-center justify-center rounded-full ${bgColor}`}>
        <span className={`${iconColor}`}>{icon}</span>
      </div>

      {/* Value */}
      <h3 className="text-xl font-semibold text-gray-800">
        {value}
      </h3>

      {/* Label */}
      <p className="text-sm text-gray-500">
        {label}
      </p>
    </div>
  );
} 