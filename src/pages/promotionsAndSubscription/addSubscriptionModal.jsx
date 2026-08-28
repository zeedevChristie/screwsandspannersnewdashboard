import { useState } from "react";

export default function AddSubscriptionModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: "",
    duration: "",
    amount: "", 
    effectiveDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        duration: String(formData.duration),
        amount: String(formData.amount),
        effectiveDate: new Date(formData.effectiveDate).toISOString(),
      };

      const options = {
          method: "GET",
          headers: {
            x_api_key: "a4261bd2-e678-4552-a432-ab16431b6249",
          },
        };

      const response = await fetch(
        "https://subscriptions.sands.com.ng/api/v1/promo/?status=active",options,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Subscription added:", result);

      onSuccess?.(result); // trigger parent refresh
      onClose(); // close modal
    } catch (err) {
      setError(`Failed to add subscription: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">Add New Subscription</h2>

        {error && <p className="text-red-500 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="e.g. Weekly"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration (days)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="e.g. 7"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (₦)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="e.g. 1000"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Effective Date
            </label>
            <input
              type="date"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              className="mt-1 block w-full border rounded-md p-2"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Add Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
