import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = "default",
  progress,
  progressColor = "primary",
}) {
  const colorClasses = {
    green: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
    red: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    orange: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
    default: "bg-background",
  };

  const accentBar = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    default: "bg-muted",
  };

  const iconColorClasses = {
    green: "text-green-600 dark:text-green-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    default: "text-muted-foreground",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        colorClasses[color]
      )}
      data-testid={`card-kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* LEFT ACCENT BAR */}
      <div className={cn("absolute left-0 top-0 h-full w-1", accentBar[color])} />

      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground tracking-wide">
          {title}
        </p>
        <Icon className={cn("h-5 w-5", iconColorClasses[color])} />
      </CardHeader>

      <CardContent>
        {/* KPI VALUE */}
        <div
          className="text-4xl font-extrabold tracking-tight"
          data-testid={`text-kpi-value-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {value}
        </div>

        {/* PROGRESS */}
        {progress !== undefined && (
          <Progress
            value={Math.max(0, Math.min(100, progress))}
            className={cn(
              "mt-3 h-2",
              progressColor === "blue" && "[&>div]:bg-blue-500",
              progressColor === "green" && "[&>div]:bg-green-500",
              progressColor === "red" && "[&>div]:bg-red-500"
            )}
          />
        )}

        {/* TREND */}
        {trend && (
          <div className="flex items-center gap-1 text-xs mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}

        {/* SUBTITLE */}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}