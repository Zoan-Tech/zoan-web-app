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
}

export const navItems: NavItem[] = [
  { href: "/", icon: HouseIcon, label: "Home" },
  { href: "/explore", icon: SquaresFourIcon, label: "Explore" },
  { href: "/create", icon: PlusIcon, label: "Create" },
  { href: "/notifications", icon: BellIcon, label: "Notifications" },
  { href: "/wallet", icon: WalletIcon, label: "WalletIcon" },
];
