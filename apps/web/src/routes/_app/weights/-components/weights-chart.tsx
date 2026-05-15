import { Card } from "@workspace/ui/components/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  WEIGHT_KEYS,
  WEIGHT_COLORS,
  WEIGHT_LABELS,
  type WeightKey,
} from "./constants";

interface WeightsChartProps {
  values: Record<WeightKey, number>;
}

/**
 * Weights Chart Component
 *
 * Displays a donut chart visualization of the weight distribution.
 */
export function WeightsChart({ values }: WeightsChartProps) {
  const pieData = WEIGHT_KEYS.map((key) => ({
    name: WEIGHT_LABELS[key],
    value: Math.round(values[key] * 100),
    color: WEIGHT_COLORS[key],
  }));

  return (
    <Card className="w-56 h-64 shrink-0 flex flex-col items-center justify-center p-4 border border-border/80">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">
        Weight Distribution
      </p>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={62}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const v = typeof value === "number" ? value : 0;
              return [`${v}%`];
            }}
            contentStyle={{
              fontSize: 10,
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
