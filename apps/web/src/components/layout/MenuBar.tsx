/**
 * MenuBar Component
 * Application menu bar with dropdown menus and command bar
 */
import { useTheme } from "@/components/theme-provider";
import {
  handleMenuAction,
  menuSections,
  type MenuActionContext,
} from "@/config/menu-config";
import { useGetDashboardStats } from "@/hooks/dashboard";
import { useLayoutStore } from "@/stores/layout-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Bell, Moon, Sun } from "lucide-react";

export function MenuBar() {
  const { setTheme, isDark, THEME_VALUES } = useTheme();
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const { data: stats } = useGetDashboardStats();

  // Create action context with theme and sidebar handlers
  const actionContext: MenuActionContext = {
    setTheme,
    toggleSidebar,
  };

  const handleAction = (action: string) => {
    handleMenuAction(action, actionContext);
  };

  const toggleTheme = () => {
    setTheme(isDark ? THEME_VALUES.LIGHT : THEME_VALUES.DARK);
  };

  return (
    <div
      className="flex items-center h-8 px-2 bg-sidebar border-b border-border/60 shrink-0 gap-0.5"
      data-testid="menubar"
    >
      {/* Menu Dropdowns */}
      {menuSections.map((menu) => (
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
            {menu.items.map((item, i) => {
              if (item.type === "separator") {
                return <DropdownMenuSeparator key={i} />;
              }

              const Icon = item.icon;

              return (
                <DropdownMenuItem
                  key={item.label}
                  className="text-xs gap-2 cursor-pointer"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.action) {
                      handleAction(item.action);
                    }
                  }}
                >
                  {Icon && (
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      <div className="flex-1" />

      {/* Command Bar Items */}
      <button
        onClick={toggleTheme}
        className="w-7 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title={isDark ? "Switch to Light" : "Switch to Dark"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
          (stats?.pending_matches ?? 0) > 0
            ? `Notifications (${stats?.pending_matches} pending)`
            : "Notifications"
        }
      >
        <Bell className="w-3.5 h-3.5" />
        {(stats?.pending_matches ?? 0) > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-destructive"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
