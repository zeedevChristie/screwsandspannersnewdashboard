export default function TabButton({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
        isActive
          ? "bg-red-500 text-white shadow"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  );
}
