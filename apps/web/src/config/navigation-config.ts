/**
 * Navigation Configuration
 * Defines navigation items for the application sidebar
 */
import {
  ClipboardList,
  FileText,
  FlaskConical,
  GitMerge,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  description?: string;
}

// ============================================================================
// Navigation Items
// ============================================================================

export const navItems: NavItem[] = [
  {
    path: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    description: "Overview and statistics",
  },
  {
    path: "/offers",
    icon: Package,
    label: "Offers",
    description: "Manage pharmacy offers",
  },
  {
    path: "/requests",
    icon: ShoppingCart,
    label: "Requests",
    description: "View pharmacy requests",
  },
  {
    path: "/matches",
    icon: GitMerge,
    label: "Matches",
    description: "Review matched trades",
  },
  {
    path: "/groups",
    icon: Users,
    label: "Groups",
    description: "Manage pharmacy groups",
  },
  {
    path: "/whatsapp",
    icon: MessageSquare,
    label: "WhatsApp",
    description: "WhatsApp integration",
  },
  {
    path: "/weights",
    icon: SlidersHorizontal,
    label: "Weights",
    description: "Configure matching weights",
  },
  {
    path: "/review",
    icon: ClipboardList,
    label: "Review Queue",
    description: "Items pending review",
  },
  {
    path: "/audit",
    icon: FileText,
    label: "Audit Log",
    description: "System activity log",
  },
  {
    path: "/simulate",
    icon: FlaskConical,
    label: "Simulator",
    description: "Test matching scenarios",
  },
];
