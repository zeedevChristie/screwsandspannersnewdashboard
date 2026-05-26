import PromoFilters from "./promoFilters";
import PromoHeader from "./promoHeader";
import PromoTable from "./promoTable";


export default function PromoCodes() {
  const data = [
    {
      code: "SUMMER20",
      discount: "20% (Max ₦100,000)",
      start: "12/02/2025",
      end: "28/02/2025",
      used: 200,
      total: 500,
      category: "Beauty",
      status: "Active",
    },
    {
      code: "XMAS-OFFER",
      discount: "₦5,000",
      start: "12/02/2025",
      end: "31/12/2025",
      used: 200,
      total: 500,
      category: "Subscriptions",
      status: "Inactive",
    },
    {
      code: "NEWYEARSERVICE",
      discount: "50% (Max ₦250,000)",
      start: "12/02/2025",
      end: "12/02/2025",
      used: 200,
      total: 500,
      category: "All Categories",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-">
      <PromoHeader />
      <PromoFilters />
      <PromoTable data={data} />
    </div>
  );
}
