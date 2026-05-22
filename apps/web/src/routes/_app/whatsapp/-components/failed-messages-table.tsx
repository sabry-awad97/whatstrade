import { useState } from "react";
import { useFailedMessages, useRetryMessage } from "@/hooks/whatsapp";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { RefreshCw, Search, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function FailedMessagesTable() {
  const [page, setPage] = useState(1);
  const [groupFilter, setGroupFilter] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useFailedMessages({
    page,
    limit: 20,
    groupName: groupFilter || undefined,
  });
  const retryMessage = useRetryMessage();

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRetry = (id: string) => {
    retryMessage.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading failed messages...
      </div>
    );
  }

  const messages = data?.messages || [];
  const total = data?.total || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by group name..."
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setPage(1); // Reset to first page on filter
            }}
            className="pl-9"
          />
        </div>
        <Badge variant="destructive">{total} failed messages</Badge>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Sender</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Retries</TableHead>
              <TableHead>Failed At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No failed messages
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <Collapsible
                  key={message.id}
                  open={expandedRows.has(message.id)}
                  onOpenChange={() => toggleRow(message.id)}
                >
                  <TableRow>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6"
                        >
                          {expandedRows.has(message.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell className="font-medium">
                      {message.groupName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{message.senderName || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {message.senderPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-red-600">
                      {message.lastError || "Unknown error"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {message.retryCount} / {message.maxRetries}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {message.lastErrorAt
                        ? formatDistanceToNow(new Date(message.lastErrorAt), {
                            addSuffix: true,
                          })
                        : "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleRetry(message.id)}
                        disabled={retryMessage.isPending}
                        size="sm"
                        variant="outline"
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${retryMessage.isPending ? "animate-spin" : ""}`}
                        />
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <CollapsibleContent>
                        <div className="p-4 bg-muted/50 space-y-2">
                          <div>
                            <h4 className="text-sm font-semibold mb-1">
                              Full Error Message:
                            </h4>
                            <p className="text-sm text-red-600 font-mono">
                              {message.lastError ||
                                "No error message available"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-1">
                              Raw Message Text:
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {message.rawText}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold">Message ID:</span>{" "}
                              <span className="font-mono text-xs">
                                {message.whatsappMessageId}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold">Created:</span>{" "}
                              {formatDistanceToNow(
                                new Date(message.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </TableCell>
                  </TableRow>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of{" "}
            {total} messages
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
