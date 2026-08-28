import { useEffect, useState } from "react";
import StatusFilter from "./statusFilter";
import SubscriptionCard from "./subscriptionCard";
import SubscriptionHeader from "./subscriptionHeader";
import AddSubscriptionModal from "./addSubscriptionModal";

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchPlans = async () => {
    try {
      const options = {
        method: "GET",
        headers: {
          x_api_key: "a4261bd2-e678-4552-a432-ab16431b6249",
        },
      };

      const response = await fetch(
        "https://subscriptions.sands.com.ng/api/v1/subscription/global-subscription-status-by-app",
        options
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Fetched subscription plans:", result);

      setPlans(result.data?.subscriptions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
      setError(`Failed to fetch subscription plans: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading) return <p>Loading subscription plans...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <SubscriptionHeader onAdd={() => setShowModal(true)} />
      {/* <StatusFilter /> */}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <SubscriptionCard
            key={index}
            title={`${plan.description} Plan`}
            description={`Duration: ${plan.duration} days`}
            price={plan.amount}
            features={[
              `Duration: ${plan.duration} days`,
              `Amount: ₦${plan.amount}`,
            ]}
            subscribers={0} // API doesn’t return subscribers count
          />
        ))}
      </div>

      <AddSubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchPlans} // refresh list after adding
      />
    </div>
  );
}
