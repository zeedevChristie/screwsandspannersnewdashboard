import { NavLink } from "react-router-dom";
import { Home, Users, Truck, ShoppingBag, Gift, LifeBuoy, BarChart2 } from "lucide-react";
import SnSlog from '../assets/icon/SnSlogo.png';
 
const menuItems = [
  { name: "Overview", icon: <Home size={18} />, path: "/dashboard" },
  { name: "Admins", icon: <Users size={18} />, path: "/admins" },
  { name: "Service Delivery", icon: <Truck size={18} />, path: "/service-delivery " },
  { name: "Supplier", icon: <ShoppingBag size={18} />, path: "/suppliers" },
  { name: "Promotions & Sub", icon: <Gift size={18} />, path: "/promotions" },
  { name: "Support", icon: <LifeBuoy size={18} />, path: "/support" },
  { name: "Report", icon: <BarChart2 size={18} />, path: "/reports" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-black text-white flex flex-col rounded-2xl m-3 p-4">
      <div className="flex items-center gap-2 mb-10 mt-2">
        <img src={SnSlog} alt="Logo" className="w-8 h-8" />
        <h1 className="font-bold text-lg">Screws & Spanners</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive ? "bg-brand-primary text-white" : "hover:bg-gray-800"
              }`
            }
          >
            {item.icon}
            <span className="text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 mt-auto border-t border-gray-700 pt-4">
        <img
          src= {SnSlog}        
          alt="User"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-semibold">tmak</p>
          <p className="text-xs text-gray-400">Super Admin</p>
        </div>
      </div>
    </aside>
  );
}
