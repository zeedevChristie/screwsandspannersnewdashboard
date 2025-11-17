import { useState } from "react";
import SearchStatistics from "./searchStatistics";
import JobOrders from "./jobOrders";
import ServiceProviders from "./serviceProviders";
import Verification from "./verification";
import CategoryTree from "./categoryTree";
import Dashboard from "../dashboard";
import TabButton from "../admin/tabButton";
import Customer from "./customer";



export default function ServiceDeliveryPage () {
  const [activeTab, setActiveTab] = useState("Search Statistics");

  const tabs = ["Search Statistics", "Job Orders", "Service Providers", "Customers", "Verification", "Category Tree"];

  const renderContent = () => {
    switch (activeTab) {
      case "Search Statistics":
        return <SearchStatistics/>;
      case "Job Orders":
        return <JobOrders />;
      case "Service Providers":
        return <ServiceProviders />;
      case "Customers":
        return <Customer />;
      case "Verification":
        return <Verification />;
      case "Category Tree":
        return <CategoryTree />;
      default:
        return <SearchStatistics />;
    }
  };

  return (
    <div >

      <Dashboard/>  
    <div className="w-full">

      <div className="flex items-center justify-between gap-8 border-b pt-3">
        {tabs.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      <div className="mt-6">{renderContent()}</div>
    </div>
    </div>  
  );
}
