import { useState } from "react";
import {
  useListGroups,
  useToggleGroupMonitoring,
  useBulkToggleGroupMonitoring,
} from "@/hooks/groups";
import { useSyncGroups } from "@/hooks/whatsapp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Switch } from "@workspace/ui/components/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { RefreshCw, Search, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function GroupListTable() {
  const { data: groups, isLoading } = useListGroups();
  const syncGroups = useSyncGroups();
  const toggleMonitoring = useToggleGroupMonitoring();
  const bulkToggle = useBulkToggleGroupMonitoring();

  const [search, setSearch] = useState("");
  const [bulkAction, setBulkAction] = useState<{ enabled: boolean } | null>(
    null,
  );

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = (jid: string, enabled: boolean) => {
    toggleMonitoring.mutate({ jid, enabled });
  };

  const handleBulkAction = (enabled: boolean) => {
    setBulkAction({ enabled });
  };

  const confirmBulkAction = () => {
    if (!bulkAction || !filteredGroups) return;

    const jids = filteredGroups.map((g) => g.jid);

    // Validate that there are groups to act on
    if (jids.length === 0) {
      setBulkAction(null);
      return;
    }

    bulkToggle.mutate({ jids, enabled: bulkAction.enabled });
    setBulkAction(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading groups...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleBulkAction(true)}
            disabled={bulkToggle.isPending}
            variant="outline"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Monitor All
          </Button>
          <Button
            onClick={() => handleBulkAction(false)}
            disabled={bulkToggle.isPending}
            variant="outline"
            size="sm"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Ignore All
          </Button>
          <Button
            onClick={() => syncGroups.mutate()}
            disabled={syncGroups.isPending}
            variant="outline"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${syncGroups.isPending ? "animate-spin" : ""}`}
            />
            Sync Groups
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>JID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead>Last Message</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!filteredGroups || filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  {search
                    ? "No groups found matching your search"
                    : "No groups found. Click 'Sync Groups' to fetch from WhatsApp."}
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {group.jid}
                  </TableCell>
                  <TableCell>
                    {group.is_monitored ? (
                      <Badge className="bg-green-600 hover:bg-green-700">
                        Monitored
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Ignored</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {group.member_count}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {(() => {
                      if (!group.last_message_at) return "Never";
                      return formatDistanceToNow(group.last_message_at, {
                        addSuffix: true,
                      });
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-sm text-muted-foreground">
                        {group.is_monitored ? "Monitoring" : "Ignored"}
                      </span>
                      <Switch
                        checked={group.is_monitored}
                        onCheckedChange={(enabled) =>
                          handleToggle(group.jid, enabled)
                        }
                        disabled={toggleMonitoring.isPending}
                        aria-label={`Toggle monitoring for ${group.name}`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredGroups?.length || 0} of {groups?.length || 0} groups
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog
        open={bulkAction !== null}
        onOpenChange={() => setBulkAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction?.enabled
                ? "Monitor All Groups?"
                : "Ignore All Groups?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {bulkAction?.enabled ? "enable" : "disable"} monitoring
              for {filteredGroups?.length || 0} groups. This action can be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
