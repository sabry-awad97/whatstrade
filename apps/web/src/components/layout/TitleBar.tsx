/**
 * TitleBar Component
 * Window controls and application branding for desktop layout
 */
import { APP_LOGO_TEXT, APP_NAME } from "@/config/constants";
import {
  useCloseWindow,
  useIsWindowMaximized,
  useMinimizeWindow,
  useToggleMaximizeWindow,
} from "@/hooks/window";
import { Button } from "@workspace/ui/components/button";
import { Copy, Minus, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function TitleBar() {
  const handleMinimize = useMinimizeWindow();
  const handleMaximize = useToggleMaximizeWindow();
  const handleClose = useCloseWindow();
  const isMaximized = useIsWindowMaximized();

  return (
    <div
      className="flex items-center h-9 px-3 bg-sidebar border-b border-border/60 shrink-0"
      data-testid="titlebar"
    >
      {/* App Branding - Draggable Region */}
      <div className="flex items-center gap-2 flex-1" data-tauri-drag-region>
        <div className="w-4 h-4 rounded-sm bg-primary/90 flex items-center justify-center shrink-0">
          <span className="text-white text-[8px] font-bold">
            {APP_LOGO_TEXT}
          </span>
        </div>
        <span className="text-xs font-medium text-foreground/80">
          {APP_NAME}
        </span>
      </div>

      {/* Window Controls - Not Draggable */}
      <div className="flex items-center gap-0.5">
        <Button
          onClick={handleMinimize}
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none hover:bg-accent p-0"
          title="Minimize"
          aria-label="Minimize window"
        >
          <Minus className="h-2.5 w-2.5" />
        </Button>
        <Button
          onClick={handleMaximize}
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none hover:bg-accent p-0"
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isMaximized ? (
              <motion.div
                key="copy"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="h-2.5 w-2.5" />
              </motion.div>
            ) : (
              <motion.div
                key="square"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Square className="h-2.5 w-2.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-none hover:bg-destructive hover:text-destructive-foreground p-0 group"
          title="Close"
          aria-label="Close window"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-2.5 w-2.5" />
          </motion.div>
        </Button>
      </div>
    </div>
  );
}
