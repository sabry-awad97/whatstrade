import { Card } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScoreData {
  name: string;
  score: number;
}

interface MatchScoresChartProps {
  data: ScoreData[];
  isLoading: boolean;
}

/**
 * Match Scores Chart Component
 *
 * Displays a bar chart showing the distribution of recent match scores.
 * Useful for visualizing match quality trends.
 */
export function MatchScoresChart({ data, isLoading }: MatchScoresChartProps) {
  return (
    <Card className="p-4 border border-border/80 col-span-2">
      <h3 className="text-xs font-semibold mb-3 text-foreground">
        Recent Match Scores
      </h3>
      {isLoading ? (
        <Skeleton className="h-[140px]" />
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart
            data={data}
            margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "hsl(var(--muted-foreground))",
              }}
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(v) => [`${v ?? 0}%`, "Score"]}
              contentStyle={{
                fontSize: 11,
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Bar
              dataKey="score"
              fill="hsl(var(--primary))"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[140px] text-xs text-muted-foreground">
          No recent matches
        </div>
      )}
    </Card>
  );
}
