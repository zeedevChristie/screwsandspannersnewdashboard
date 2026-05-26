export default function PromotionsFormInput({
  label,
  placeholder,
  type = "text",
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-black/10 focus:outline-none"
      />
    </div>
  );
}
