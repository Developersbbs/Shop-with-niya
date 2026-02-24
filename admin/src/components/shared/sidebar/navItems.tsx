import { MdOutlineDashboard, MdOutlineViewCarousel } from "react-icons/md";
import { Users2 as LuUsers2 } from "lucide-react";
import { TbPackages, TbTruckDelivery, TbBuildingStore } from "react-icons/tb";
import { RiCoupon2Line } from "react-icons/ri";
import { TbTag } from "react-icons/tb";
import { TbBriefcase } from "react-icons/tb";
import { MdOutlineShoppingCart, MdOutlineStar } from "react-icons/md";
import { Home } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { FaBullhorn, FaGift, FaTag } from "react-icons/fa6";

export const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: <MdOutlineDashboard />,
  },
  {
    title: "Home Page",
    url: "#", // Parent item doesn't navigate
    icon: <Home />, // Using Dashboard icon as placeholder or import MdHome if available
    children: [
      {
        title: "Hero Section",
        url: "/hero-section",
        icon: <MdOutlineViewCarousel />,
      },
      {
        title: "Special Offers",
        url: "/special-offers",
        icon: <FaGift />,
      },
      {
        title: "Marquee Offers",
        url: "/marquee-offers",
        icon: <FaBullhorn />,
      },
      {
        title: "Offer Popups",
        url: "/offer-popups",
        icon: <FaGift />,
      },
    ]
  },
  {
    title: "Categories",
    url: "/categories",
    icon: <TbTag />,
  },

  {
    title: "Products",
    url: "/products",
    icon: <MdOutlineShoppingCart />,
  },

  {
    title: "Stocks",
    url: "/stock",
    icon: <TbPackages />,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: <MdOutlineStar />,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: <TbTruckDelivery />,
  },

  {
    title: "Coupons",
    url: "/coupons",
    icon: <RiCoupon2Line />,
  },

  {
    title: "Offers",
    url: "/offers",
    icon: <FaGift />,
    children: [
      {
        title: "Combo Offers",
        url: "/offers/combo-offers",
        icon: <FaTag />
      }
    ]
  },
  {
    title: "Customers",
    url: "/customers",
    icon: <LuUsers2 />,
  },
  {
    title: "Staff",
    url: "/staff",
    icon: <TbBriefcase />,
  },
  // {
  //   title:"vendors",
  //   url:"/vendors",
  //   icon:<TbBuildingStore/>
  // },
  {
    title: "Reports",
    url: "/reports",
    icon: <BarChart3 />
  }
];
