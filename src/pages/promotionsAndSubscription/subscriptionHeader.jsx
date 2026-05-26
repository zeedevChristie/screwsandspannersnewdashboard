export default function SubscriptionHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Subscriptions
        </h1>
        <p className="text-gray-500 text-sm">
          Manage promotions, subscription plans, and promo codes
        </p>
      </div>

      <button className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition">
        + Add New Subscription
      </button>
    </div>
  );
}
