/**
 * Layout Component
 * Main application layout with title bar, menu bar, sidebar, and status bar
 */
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { TitleBar } from "@/components/layout/TitleBar";
import { MenuBar } from "@/components/layout/MenuBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { TIMING } from "@/config/constants";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <TooltipProvider delayDuration={TIMING.TOOLTIP_DELAY}>
      <div className="flex flex-col h-screen overflow-hidden bg-background select-none">
        <TitleBar />
        <MenuBar />

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar />

          {/* Page Content */}
          <main
            className="flex-1 min-w-0 overflow-auto flex flex-col animate-fade-up"
            data-testid="main-content"
          >
            {children}
          </main>
        </div>

        <StatusBar />
      </div>
    </TooltipProvider>
  );
}
