import { useGetDashboardStats } from "@/hooks/dashboard";
import { useTheme } from "@/components/theme-provider";
import { Link, useLocation } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  GitMerge,
  HelpCircle,
  LayoutDashboard,
  Monitor,
  Moon,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  SlidersHorizontal,
  Sun,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/offers", icon: Package, label: "Offers" },
  { path: "/requests", icon: ShoppingCart, label: "Requests" },
  { path: "/matches", icon: GitMerge, label: "Matches" },
  { path: "/groups", icon: Users, label: "Groups" },
  { path: "/weights", icon: SlidersHorizontal, label: "Weights" },
  { path: "/review", icon: ClipboardList, label: "Review Queue" },
  { path: "/audit", icon: FileText, label: "Audit Log" },
  { path: "/simulate", icon: FlaskConical, label: "Simulator" },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  // Fetch real-time dashboard statistics
  const { data: stats } = useGetDashboardStats();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-screen overflow-hidden bg-background select-none">
        {/* Title Bar */}
        <div
          className="flex items-center h-9 px-3 bg-sidebar border-b border-border/60 shrink-0"
          data-testid="titlebar"
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="w-4 h-4 rounded-sm bg-primary/90 flex items-center justify-center shrink-0">
              <span className="text-white text-[8px] font-bold">Rx</span>
            </div>
            <span className="text-xs font-medium text-foreground/80">
              PharmaBroker
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              className="w-11 h-full flex items-center justify-center hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
              title="Minimize"
            >
              <div className="w-2.5 h-px bg-foreground/70" />
            </button>
            <button
              className="w-11 h-full flex items-center justify-center hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
              title="Maximize"
            >
              <div className="w-2.5 h-2.5 border border-foreground/70 rounded-sm" />
            </button>
            <button
              className="w-11 h-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-none"
              title="Close"
            >
              <span className="text-xs font-light">✕</span>
            </button>
          </div>
        </div>

        {/* Menu Bar */}
        <div
          className="flex items-center h-8 px-2 bg-sidebar border-b border-border/60 shrink-0 gap-0.5"
          data-testid="menubar"
        >
          {[
            {
              label: "File",
              items: [
                { label: "Export Data", icon: Download },
                { label: "Import Config", icon: Upload },
                { type: "sep" },
                { label: "Refresh All", icon: RefreshCw },
                { type: "sep" },
                { label: "Exit", icon: null },
              ],
            },
            {
              label: "View",
              items: [
                { label: "Toggle Sidebar", icon: ChevronLeft },
                { type: "sep" },
                { label: "Light Mode", icon: Sun },
                { label: "Dark Mode", icon: Moon },
                { label: "System Theme", icon: Monitor },
              ],
            },
            {
              label: "Tools",
              items: [
                { label: "Trigger Learning Job", icon: RefreshCw },
                { label: "Run Calibration", icon: Settings },
                { type: "sep" },
                { label: "A/B Test Manager", icon: null },
                { label: "System Diagnostics", icon: null },
              ],
            },
            {
              label: "Help",
              items: [
                { label: "Documentation", icon: HelpCircle },
                { label: "Keyboard Shortcuts", icon: null },
                { type: "sep" },
                { label: "About PharmaBroker", icon: null },
              ],
            },
          ].map((menu) => (
            <DropdownMenu key={menu.label}>
              <DropdownMenuTrigger asChild>
                <button
                  className="px-2.5 h-6 text-xs rounded text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:bg-accent"
                  data-testid={`menu-${menu.label.toLowerCase()}`}
                >
                  {menu.label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[180px] rounded-lg shadow-lg border border-border/80"
              >
                {menu.items.map((item, i) =>
                  item.type === "sep" ? (
                    <DropdownMenuSeparator key={i} />
                  ) : (
                    <DropdownMenuItem
                      key={item.label}
                      className="text-xs gap-2 cursor-pointer"
                      onClick={() => {
                        if (item.label === "Light Mode") setTheme("light");
                        else if (item.label === "Dark Mode") setTheme("dark");
                        else if (item.label === "System Theme")
                          setTheme("system");
                      }}
                    >
                      {item.icon && (
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      {item.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <div className="flex-1" />
          {/* Command bar items */}
          <button
            onClick={toggleTheme}
            className="w-7 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={isDark ? "Switch to Light" : "Switch to Dark"}
            data-testid="btn-theme-toggle"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            className="w-7 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors relative"
            title="Notifications"
            aria-label={
              (stats?.pendingMatches ?? 0) > 0
                ? `Notifications (${stats?.pendingMatches} pending)`
                : "Notifications"
            }
          >
            <Bell className="w-3.5 h-3.5" />
            {(stats?.pendingMatches ?? 0) > 0 && (
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive" />
            )}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <aside
            className={`flex flex-col bg-sidebar border-r border-border/60 shrink-0 transition-all duration-200 ease-out ${collapsed ? "w-12" : "w-48"}`}
            data-testid="sidebar"
          >
            <div className="flex flex-col gap-0.5 p-1.5 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" &&
                    location.pathname.startsWith(item.path));
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <Link to={item.path}>
                        <div
                          className={`flex items-center gap-2.5 px-2.5 h-8 rounded-md cursor-pointer transition-all duration-100 group
                            ${
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-sidebar-foreground/70 hover:bg-accent/50 hover:text-sidebar-foreground"
                            }`}
                          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <item.icon
                            className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                          />
                          {!collapsed && (
                            <span className="text-xs truncate">
                              {item.label}
                            </span>
                          )}
                          {isActive && !collapsed && (
                            <div className="ml-auto w-1 h-4 rounded-full bg-primary" />
                          )}
                        </div>
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>

            {/* Collapse Toggle */}
            <div className="p-1.5 border-t border-border/60">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-sidebar-foreground transition-colors"
                data-testid="btn-sidebar-toggle"
              >
                {collapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </aside>

          {/* Page Content */}
          <main
            className="flex-1 min-w-0 overflow-auto flex flex-col animate-fade-up"
            data-testid="main-content"
          >
            {children}
          </main>
        </div>

        {/* Status Bar */}
        <div
          className="flex items-center h-6 px-3 bg-primary text-primary-foreground shrink-0 gap-3 text-[10px]"
          data-testid="statusbar"
        >
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
            Connected
          </span>
          <Separator
            orientation="vertical"
            className="h-3 bg-primary-foreground/30"
          />
          <span>{stats?.totalMatches ?? 0} total matches</span>
          <Separator
            orientation="vertical"
            className="h-3 bg-primary-foreground/30"
          />
          <span>{stats?.activeGroups ?? 0} monitored groups</span>
          <Separator
            orientation="vertical"
            className="h-3 bg-primary-foreground/30"
          />
          <span>{stats?.todayMessages ?? 0} messages today</span>
          <div className="flex-1" />
          <span className="text-primary-foreground/70">
            PharmaBroker v1.0.0
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
