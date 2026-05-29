/**
 * TitleBar Component
 * Window controls and application branding for desktop layout
 */
import {
  useCloseWindow,
  useMinimizeWindow,
  useToggleMaximizeWindow,
} from "@/hooks/window";
import { APP_LOGO_TEXT, APP_NAME } from "@/config/constants";

export function TitleBar() {
  const handleMinimize = useMinimizeWindow();
  const handleMaximize = useToggleMaximizeWindow();
  const handleClose = useCloseWindow();

  return (
    <div
      className="flex items-center h-9 px-3 bg-sidebar border-b border-border/60 shrink-0"
      data-testid="titlebar"
    >
      {/* App Branding */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-4 h-4 rounded-sm bg-primary/90 flex items-center justify-center shrink-0">
          <span className="text-white text-[8px] font-bold">
            {APP_LOGO_TEXT}
          </span>
        </div>
        <span className="text-xs font-medium text-foreground/80">
          {APP_NAME}
        </span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
          title="Minimize"
          aria-label="Minimize window"
        >
          <div className="w-2.5 h-px bg-foreground/70" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center hover:bg-black/6 dark:hover:bg-white/6 transition-colors"
          title="Maximize"
          aria-label="Maximize window"
        >
          <div className="w-2.5 h-2.5 border border-foreground/70 rounded-sm" />
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-none"
          title="Close"
          aria-label="Close window"
        >
          <span className="text-xs font-light">✕</span>
        </button>
      </div>
    </div>
  );
}
