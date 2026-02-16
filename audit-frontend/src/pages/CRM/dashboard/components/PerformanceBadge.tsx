import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap, Clock, RefreshCw } from "lucide-react";
import type { PerformanceMetrics } from "@/types/crm/dashboard.types";
import { cn } from "@/lib/utils";

interface PerformanceBadgeProps {
  performance: PerformanceMetrics;
  className?: string;
}

export function PerformanceBadge({ performance, className }: PerformanceBadgeProps) {
  const { responseTimeMs, cacheStatus } = performance;

  const getCacheColor = () => {
    switch (cacheStatus) {
      case "HIT":
        return "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "REFRESHED":
        return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      default:
        return "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700";
    }
  };

  const getPerformanceColor = () => {
    if (responseTimeMs < 50) return "text-green-600 dark:text-green-400";
    if (responseTimeMs < 200) return "text-blue-600 dark:text-blue-400";
    if (responseTimeMs < 500) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPerformanceIcon = () => {
    if (responseTimeMs < 50) return <Zap className="h-3 w-3" />;
    if (responseTimeMs < 200) return <Clock className="h-3 w-3" />;
    return <RefreshCw className="h-3 w-3" />;
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Cache Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("text-xs", getCacheColor())}>
              {cacheStatus === "HIT" ? "⚡ Cached" : cacheStatus === "REFRESHED" ? "🔄 Refreshed" : "⏱️ Fresh"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {cacheStatus === "HIT"
                ? "Data served from cache"
                : cacheStatus === "REFRESHED"
                ? "Cache was refreshed"
                : "Data freshly generated"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Response Time Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs">
              <span className={cn("flex items-center gap-1", getPerformanceColor())}>
                {getPerformanceIcon()}
                {responseTimeMs.toFixed(0)}ms
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Response time: {responseTimeMs.toFixed(2)}ms
              <br />
              {responseTimeMs < 50 && "⚡ Lightning fast!"}
              {responseTimeMs >= 50 && responseTimeMs < 200 && "✅ Great performance"}
              {responseTimeMs >= 200 && responseTimeMs < 500 && "⚠️ Acceptable"}
              {responseTimeMs >= 500 && "🐌 Slow - consider refresh"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
