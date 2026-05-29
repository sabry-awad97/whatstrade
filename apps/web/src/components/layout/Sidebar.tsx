/**
 * Sidebar Component
 * Navigation sidebar with collapsible state
 */
import { Link, useLocation } from "@tanstack/react-router";
import { useLayoutStore } from "@/stores/layout-store";
import { navItems } from "@/config/navigation-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Sidebar() {
  const location = useLocation();
  const collapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);

  return (
    <aside
      className={`flex flex-col bg-sidebar border-r border-border/60 shrink-0 transition-all duration-200 ease-out ${collapsed ? "w-12" : "w-48"}`}
      data-testid="sidebar"
    >
      {/* Navigation Items */}
      <div className="flex flex-col gap-0.5 p-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

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
                      <span className="text-xs truncate">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1 h-4 rounded-full bg-primary" />
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="text-xs">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-muted-foreground text-[10px]">
                      {item.description}
                    </div>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="p-1.5 border-t border-border/60">
        <button
          onClick={toggleSidebar}
          className="w-full h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50 hover:text-sidebar-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
  );
}
