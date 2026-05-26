export default function PromoHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Promo Codes
        </h1>
        <p className="text-gray-500 text-sm">
          Manage promotions, subscription plans, and promo codes
        </p>
      </div>

      <button className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition">
        + Add Promo Code
      </button>
    </div>
  );
}
