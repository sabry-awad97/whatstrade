import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

interface BandData {
  name: string;
  value: number;
  color: string;
}

interface ConfidenceBandChartProps {
  data: BandData[];
  isLoading: boolean;
}

/**
 * Confidence Band Chart Component
 *
 * Displays a donut chart showing the distribution of matches across
 * confidence bands (Auto, Suggest, Review, None).
 */
export function ConfidenceBandChart({
  data,
  isLoading,
}: ConfidenceBandChartProps) {
  return (
    <Card className="p-4 border border-border/80">
      <h3 className="text-xs font-semibold mb-3 text-foreground">
        Confidence Bands
      </h3>
      {isLoading ? (
        <Skeleton className="h-[120px]" />
      ) : data.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <path key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [value ?? 0, name ?? ""]}
                contentStyle={{
                  fontSize: 11,
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {data.map((b) => (
              <div key={b.name} className="flex items-center gap-2 text-[11px]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-foreground font-medium">{b.name}</span>
                <span className="text-muted-foreground ml-auto">{b.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground">
          No match data available
        </div>
      )}
    </Card>
  );
}
