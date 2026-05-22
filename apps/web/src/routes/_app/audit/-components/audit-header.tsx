import { Badge } from "@workspace/ui/components/badge";
import { FileText } from "lucide-react";

interface AuditHeaderProps {
  showingCount: number | undefined;
}

/**
 * Audit Header Component
 *
 * Displays the audit log page title and showing count badge.
 */
export function AuditHeader({ showingCount }: AuditHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-card/50 shrink-0">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold">Audit Log</h1>
        {showingCount !== undefined && (
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            Showing {showingCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
