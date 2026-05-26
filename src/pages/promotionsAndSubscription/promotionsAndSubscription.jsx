import React, { useState } from 'react'
import SubscriptionPlans from './subscriptionPlans';
import PromoCodes from './promoCodes';
import Dashboard from '../dashboard';
import TabButton from '../admin/tabButton';
import PromotionsTab from './promotionsTab';

export default function PromotionsAndSubscription () {
  const [activeTab, setActiveTab] = useState("Promotions");

  const tabs = ["Promotions", "Subscription Plans", "Promo Codes"];

  const renderContent = () => {
    switch (activeTab) {
      case "Promotions":
        return <PromotionsTab/>;
      case "Subscription Plans":
        return <SubscriptionPlans/>;
      case "Promo Codes":
        return <PromoCodes/>;
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