import { 
  HouseIcon,
  SquaresFourIcon,
  WalletIcon,
  BellIcon,
  PlusIcon,
  type Icon
} from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  icon: Icon;
  label: string;
  className?: string;
  inactiveClassName?: string;
  iconClassName?: string;
}

export const navItems: NavItem[] = [
  { href: "/", icon: HouseIcon, label: "Home" },
  { href: "/explore", icon: SquaresFourIcon, label: "Explore" },
  { href: "/post/create", icon: PlusIcon, label: "Create", className: "!h-[48px] !w-[60px] !rounded", inactiveClassName: "bg-[#E1F1F04D]", iconClassName: "!h-6 !w-6" },
  { href: "/notifications", icon: BellIcon, label: "Notifications" },
  { href: "/wallet", icon: WalletIcon, label: "WalletIcon" },
];
