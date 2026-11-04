import { useMemo, useState } from "react";

import { getAuthBio } from "@/api/auth";
import { DashboardWidget } from "@/types/dashboard";
import Header from "./dashboard/header";
import WidgetGrid from "./dashboard/widgets";
import { useDashboardStatistics } from "@/hooks/useDashboardStatistics";
import { useRevenue } from "@/hooks/useRevenue";
import { formatNairaCompact } from "@/lib/revenue";
import { Building2, Ticket, Truck, UserRound, Users, Wallet } from "lucide-react";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const bio = getAuthBio();

  const { data, isLoading, error } = useDashboardStatistics();

  // Revenue: added up from the "amount paid" of every subscription
  const { data: revenue, isLoading: revenueLoading } = useRevenue();

  const widgets = useMemo<DashboardWidget[]>(
    () => [
      {
        title: "Active Users",
        value: data?.totalActiveUsers || 0,
        subValue: `Total Registered • ${(
          data?.totalRegistrations || 0
        ).toLocaleString()}`,
        theme: "orange",
        icon: Users,
      },
      {
        title: "Active SPs",
        value: data?.serviceProviders?.active ?? 0,
        subValue: `Total Providers • ${(
          data?.serviceProviders?.total ?? 0
        ).toLocaleString()}`,
        theme: "blue",
        icon: Building2,
      },
      {
        title: "Active Customers",
        value: data?.customers?.active ?? 0,
        subValue: `Total Customers • ${(
          data?.customers?.total ?? 0
        ).toLocaleString()}`,
        theme: "purple",
        icon: UserRound,
      },
      {
        title: "Active Suppliers",
        value: "-",
        subValue: "Total Suppliers • -",
        theme: "yellow",
        icon: Truck,
      },
      {
        title: "Revenue",
        value: revenueLoading ? "..." : revenue ? formatNairaCompact(revenue.total) : "₦-",
        subValue: revenue
          ? `This month • ${formatNairaCompact(revenue.thisMonth)}`
          : "This month • ₦-",
        theme: "green",
        icon: Wallet,
      },
      {
        title: "Tickets",
        value: "-",
        subValue: "Open Tickets • -",
        theme: "red",
        icon: Ticket,
      },
    ],
    [data, revenue, revenueLoading]
  );

  return (
    <>
      <Header bio={bio} isOpen={isOpen} setIsOpen={setIsOpen} />
      <WidgetGrid widgets={widgets} isOpen={isOpen} />
    </>
  );
}