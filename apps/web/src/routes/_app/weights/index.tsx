import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { authClient } from "@/lib/auth-client";
import { useGetWeights, useUpdateWeights } from "@/hooks/weights";
import {
  WeightsHeader,
  WeightsSliders,
  WeightsChart,
  DEFAULT_WEIGHTS,
  type WeightKey,
} from "./-components";

export const Route = createFileRoute("/_app/weights/")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function RouteComponent() {
  // Fetch current weights
  const { data: weights, isLoading } = useGetWeights();
  const updateMutation = useUpdateWeights();

  // Local state for weight values
  const [values, setValues] =
    useState<Record<WeightKey, number>>(DEFAULT_WEIGHTS);
  const [dirty, setDirty] = useState(false);

  // Sync with fetched weights
  useEffect(() => {
    if (weights) {
      setValues({
        medication: Number(weights.medication),
        quantity: Number(weights.quantity),
        dosage: Number(weights.dosage),
        price: Number(weights.price),
        recency: Number(weights.recency),
      });
    }
  }, [weights]);

  // Handle slider change
  const handleChange = (key: WeightKey, val: number[]) => {
    setValues((prev) => ({ ...prev, [key]: val[0] }));
    setDirty(true);
  };

  // Handle save
  const handleSave = () => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        setDirty(false);
        toast.success("Weights updated", {
          description: "Matching engine weights have been saved.",
        });
      },
      onError: (error) => {
        toast.error("Failed to update weights", {
          description: error.message,
        });
      },
    });
  };

  // Handle reset to defaults
  const handleReset = () => {
    setValues(DEFAULT_WEIGHTS);
    setDirty(true);
  };

  return (
    <div className="flex flex-col h-full">
      <WeightsHeader
        dirty={dirty}
        isPending={updateMutation.isPending}
        onSave={handleSave}
        onReset={handleReset}
      />

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <div className="flex gap-6 max-w-3xl">
            <WeightsSliders values={values} onChange={handleChange} />
            <WeightsChart values={values} />
          </div>
        )}
      </div>
    </div>
  );
}
