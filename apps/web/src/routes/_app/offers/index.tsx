import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import { useListOffers, useGetOffer } from "@/hooks/offers";
import {
  OffersHeader,
  OffersFilterBar,
  OffersTable,
  OfferDetailPanel,
  type FilterOption,
} from "./-components";

export const Route = createFileRoute("/_app/offers/")({
  component: RouteComponent,
});

function RouteComponent() {
  // State management
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");

  // Fetch offers list
  const { data: offersResponse, isLoading } = useListOffers({
    pagination: { page: 0, page_size: 50 },
    filter: { search: debouncedSearch || undefined },
  });

  // Fetch selected offer details
  const { data: selectedOffer } = useGetOffer(selectedId!, {
    enabled: !!selectedId,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle offer selection
  const handleSelectOffer = (id: string) => {
    setSelectedId(selectedId === id ? null : id);
  };

  // Handle closing detail panel
  const handleCloseDetail = () => {
    setSelectedId(null);
  };

  // Filter offers based on active filter
  const filteredOffers =
    activeFilter === "all"
      ? offersResponse?.offers
      : offersResponse?.offers?.filter(
          (offer) => offer.status === activeFilter,
        );

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className="flex flex-col flex-1 min-w-0">
        <OffersHeader
          totalCount={filteredOffers?.length}
          search={search}
          onSearchChange={setSearch}
        />

        <OffersFilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <OffersTable
          offers={filteredOffers}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelectOffer={handleSelectOffer}
        />
      </div>

      {/* Detail Panel */}
      {selectedId && (
        <OfferDetailPanel offer={selectedOffer} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
