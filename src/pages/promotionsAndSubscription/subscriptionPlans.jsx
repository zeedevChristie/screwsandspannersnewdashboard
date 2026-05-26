import StatusFilter from "./statusFilter";
import SubscriptionCard from "./subscriptionCard";
import SubscriptionHeader from "./subscriptionHeader";


export default function SubscriptionPlans() {
  const plans = [
    {
      title: "Basic Plan",
      description: "Perfect for occasional needs",
      price: 5000,
      subscribers: 450,
      features: [
        "Up to 5 service requests",
        "Email support",
        "Basic analytics",
      ],
    },
    {
      title: "Premium Plan",
      description: "Best value for regular users",
      price: 15000,
      subscribers: 280,
      features: [
        "Unlimited service requests",
        "Priority support",
        "Advanced analytics",
        "Dedicated account manager",
      ],
    },
    {
      title: "Enterprise Plan",
      description: "For businesses and high-volume users",
      price: 50000,
      subscribers: 85,
      features: [
        "Unlimited services",
        "24/7 Premium support",
        "Custom integrations",
        "API access",
        "+1 more features",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-">
      <SubscriptionHeader/>
      <StatusFilter />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <SubscriptionCard key={index} {...plan} />
        ))}
      </div>
    </div>
  );
}
