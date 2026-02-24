"use client";

import { useEffect, useState } from "react";
import { HiOutlineRefresh } from "react-icons/hi";
import { HiOutlineSquare3Stack3D, HiCalendarDays } from "react-icons/hi2";

import { cn } from "@/lib/utils";
import Typography from "@/components/ui/typography";
import { DashboardCard } from "@/types/card";

interface SalesData {
  todayOrders: number;
  yesterdayOrders: number;
  thisMonth: number;
  lastMonth: number;
  allTimeSales: number;
}

export default function SalesOverview() {
  const [salesData, setSalesData] = useState<SalesData>({
    todayOrders: 0,
    yesterdayOrders: 0,
    thisMonth: 0,
    lastMonth: 0,
    allTimeSales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/sales-overview`);
        const result = await response.json();
        
        if (result.success) {
          setSalesData(result.data);
        } else {
          console.error('Failed to fetch sales data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
const cards: DashboardCard[] = [
  {
    icon: <HiOutlineSquare3Stack3D />,
    title: "Today Orders",
    value: loading ? "Loading..." : formatCurrency(salesData.todayOrders),
    className: "bg-teal-600",
  },
  {
    icon: <HiOutlineSquare3Stack3D />,
    title: "Yesterday Orders",
    value: loading ? "Loading..." : formatCurrency(salesData.yesterdayOrders),
    className: "bg-orange-400",
  },
  {
    icon: <HiOutlineRefresh />,
    title: "This Month",
    value: loading ? "Loading..." : formatCurrency(salesData.thisMonth),
    className: "bg-blue-500",
  },
  {
    icon: <HiCalendarDays />,
    title: "Last Month",
    value: loading ? "Loading..." : formatCurrency(salesData.lastMonth),
    className: "bg-cyan-600",
  },
  {
    icon: <HiCalendarDays />,
    title: "All-Time Sales",
    value: loading ? "Loading..." : formatCurrency(salesData.allTimeSales),
    className: "bg-emerald-600",
  },
];
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-2">
      {cards.map((card, index) => (
        <div
          key={`sales-overview-${index}`}
          className={cn(
            "p-6 rounded-lg flex flex-col items-center justify-center space-y-3 text-white text-center",
            card.className
          )}
        >
          <div className="[&>svg]:size-8">{card.icon}</div>

          <Typography className="text-base">{card.title}</Typography>

          <Typography className="text-2xl font-semibold">
            {card.value}
          </Typography>
        </div>
      ))}
    </div>
  );
}
