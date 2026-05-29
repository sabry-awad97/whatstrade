import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { useListRequests, useGetRequest } from "@/hooks/requests";
import {
  RequestsHeader,
  RequestsFilterBar,
  RequestsTable,
  RequestDetailPanel,
  type FilterOption,
} from "./-components";

export const Route = createFileRoute("/_app/requests/")({
  component: RouteComponent,
});

function RouteComponent() {
  // State management
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  // Fetch requests list
  const { data: requestsResponse, isLoading } = useListRequests({
    pagination: { page: 0, page_size: 50 },
    filter: { search: debouncedSearch || undefined },
  });

  // Fetch selected request details
  const { data: selectedRequest } = useGetRequest(selectedId!, {
    enabled: !!selectedId,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle request selection
  const handleSelectRequest = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
  };

  // Handle closing detail panel
  const handleCloseDetail = () => {
    setSelectedId(null);
  };

  // Filter requests based on active filter
  const filteredRequests =
    activeFilter === "all"
      ? requestsResponse?.requests
      : requestsResponse?.requests?.filter(
          (request) => request.status === activeFilter,
        );

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className="flex flex-col flex-1 min-w-0">
        <RequestsHeader
          totalCount={filteredRequests?.length}
          search={search}
          onSearchChange={setSearch}
        />

        <RequestsFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <RequestsTable
          requests={filteredRequests}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelectRequest={handleSelectRequest}
        />
      </div>

      {/* Detail Panel */}
      {selectedId && (
        <RequestDetailPanel
          request={selectedRequest}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
