import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Clock, AlertCircle, CheckCircle, Loader2, Skull } from "lucide-react";
import { useSpring, animated } from "@react-spring/web";
import { useQueueStats } from "@/hooks/message-queue";

interface StatCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  total,
  icon,
  color,
  isLoading,
}: StatCardProps) {
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  // Animated number count-up
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { tension: 280, friction: 60 },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <animated.div className="text-2xl font-bold">
          {number.to((n) => Math.floor(n))}
        </animated.div>
        <p className="text-xs text-muted-foreground">{percentage}% of total</p>
      </CardContent>
    </Card>
  );
}

export function QueueStatsCards() {
  const { data: stats, isLoading } = useQueueStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Pending"
        value={stats?.pending || 0}
        total={stats?.total || 0}
        icon={<Clock className="h-4 w-4" />}
        color="text-blue-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Processing"
        value={stats?.processing || 0}
        total={stats?.total || 0}
        icon={<Loader2 className="h-4 w-4 animate-spin" />}
        color="text-yellow-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Failed"
        value={stats?.failed || 0}
        total={stats?.total || 0}
        icon={<AlertCircle className="h-4 w-4" />}
        color="text-red-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Completed"
        value={stats?.completed || 0}
        total={stats?.total || 0}
        icon={<CheckCircle className="h-4 w-4" />}
        color="text-green-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Dead Letter"
        value={stats?.dead_letter || 0}
        total={stats?.total || 0}
        icon={<Skull className="h-4 w-4" />}
        color="text-gray-600"
        isLoading={isLoading}
      />
    </div>
  );
}
