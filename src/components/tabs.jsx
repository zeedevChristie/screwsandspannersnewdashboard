import React from 'react';

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-4 border-b border-gray-200">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`py-3 text-sm font-medium ${active === t.key ? 'tab-active' : 'text-gray-600 hover:text-gray-800'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
