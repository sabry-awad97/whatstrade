import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useGetWeights, useUpdateWeights } from "@/hooks/weights";
import {
  DEFAULT_WEIGHTS,
  WeightsChart,
  WeightsHeader,
  WeightsSliders,
  type WeightKey,
} from "./-components";

export const Route = createFileRoute("/_app/weights/")({
  component: RouteComponent,
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
    if (weights && !dirty) {
      setValues({
        medication: Number(weights.medication),
        quantity: Number(weights.quantity),
        dosage: Number(weights.dosage),
        price: Number(weights.price),
        recency: Number(weights.recency),
      });
    }
  }, [weights, dirty]);
  // Handle slider change
  const handleChange = (key: WeightKey, val: number[]) => {
    setValues((prev) => ({ ...prev, [key]: val[0] }));
    setDirty(true);
  };

  // Handle save
  const handleSave = () => {
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1) > 0.001) {
      toast.error("Invalid weights", {
        description: "Weights must sum to 100%",
      });
      return;
    }

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
    // Only mark dirty if defaults differ from server weights
    if (weights) {
      const EPSILON = 0.001; // Tolerance for floating-point comparison (consistent with validation)
      const isDifferent = (Object.keys(DEFAULT_WEIGHTS) as WeightKey[]).some(
        (key) => {
          const parsedWeight = Number(weights[key]);
          return Math.abs(DEFAULT_WEIGHTS[key] - parsedWeight) > EPSILON;
        },
      );
      setDirty(isDifferent);
    } else {
      setDirty(false);
    }
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
