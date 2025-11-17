import { useState } from "react";



import RolesAndRights from "./rolesAndRights";
import Privileges from "./privileges";
import AccessControl from "./accessControl";
import AdminUsers from "./adminUsers";
import TabButton from "./tabButton";
import Dashboard from "../dashboard";

export default function AdminPage () {
  const [activeTab, setActiveTab] = useState("Admin Users");

  const tabs = ["Admin Users", "Roles & Rights", "Privileges", "Access Control"];

  const renderContent = () => {
    switch (activeTab) {
      case "Admin Users":
        return <AdminUsers />;
      case "Roles & Rights":
        return <RolesAndRights />;
      case "Privileges":
        return <Privileges />;
      case "Access Control":
        return <AccessControl />;
      default:
        return null;
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
