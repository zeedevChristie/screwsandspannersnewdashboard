import TopCategoriesCard from "./overviewComponents/topCategoriesCard";
import TopRegistrationsCard from "./overviewComponents/topRegistrationsCard";


export default function OverviewTopSections() {

  const categories = [
    { name: "Beauty", value: 1240, percentage: 70, change: 12 },
    { name: "Plumbing", value: 980, percentage: 60, change: 8 },
    { name: "Electrical", value: 756, percentage: 45, change: -3 },
    { name: "Cleaning", value: 520, percentage: 35, change: 5 },
  ];

  const registrations = [
    { name: "Lagos", value: 3240, percentage: 90 },
    { name: "Abuja", value: 1850, percentage: 75 },
    { name: "Port Harcourt", value: 1120, percentage: 65 },
    { name: "Ibadan", value: 890, percentage: 55 },
    { name: "Others", value: 520, percentage: 45 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TopCategoriesCard data={categories} />
      <TopRegistrationsCard data={registrations} />
    </div>
  );
}