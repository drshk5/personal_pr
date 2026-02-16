import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  Calendar,
  Zap,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useDashboard } from "./hooks/useDashboard";
import { KpiCard } from "./components/KpiCard";
import { PerformanceBadge } from "./components/PerformanceBadge";
import { PipelineFunnelChart } from "./components/PipelineFunnelChart";
import { RevenueTrendChart } from "./components/RevenueTrendChart";
import { LeadsDistributionChart } from "./components/LeadsDistributionChart";
import { TopOpportunitiesList } from "./components/TopOpportunitiesList";
import { UpcomingActivitiesList } from "./components/UpcomingActivitiesList";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import type { DashboardData } from "@/types/crm/dashboard.types";

export default function CrmDashboard() {
  const {
    dashboard,
    performance,
    isLoading,
    error,
    refetch,
    refresh,
    isRefreshing,
    invalidateCache,
    isInvalidating,
  } = useDashboard();

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  // Auto-refresh logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            refetch();
            return 300; // Reset to 5 minutes
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(300);
    }

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refetch]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const dashboardData = normalizeDashboardData(
    (dashboard as any)?.data ?? dashboard
  );

  if (error) {
    return (
      <div className="container mx-auto p-6 text-foreground">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            {(error as any).message || "Failed to load dashboard data. Please try again."}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CRM Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights into your sales pipeline and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {performance && <PerformanceBadge performance={performance} />}

          {autoRefreshEnabled && (
            <div className="text-sm text-muted-foreground">
              Next refresh in: <span className="font-mono font-semibold">{formatCountdown(countdown)}</span>
            </div>
          )}

          <Button
            variant={autoRefreshEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefreshEnabled ? "Auto-Refresh ON" : "Auto-Refresh OFF"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Force Refresh
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => invalidateCache()}
            disabled={isInvalidating}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <DashboardSkeleton />
      ) : dashboard ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* KPI Cards Row 1 - Lead Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Leads"
              value={dashboardData.intTotalLeads.toLocaleString()}
              subtitle="All leads in pipeline"
              icon={Users}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            />
            <KpiCard
              title="Qualified Leads"
              value={dashboardData.intQualifiedLeads.toLocaleString()}
              subtitle={`${dashboardData.intTotalLeads > 0
                ? ((dashboardData.intQualifiedLeads / dashboardData.intTotalLeads) * 100).toFixed(1)
                : "0.0"}% of total`}
              icon={Target}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-100 dark:bg-green-900/30"
            />
            <KpiCard
              title="Open Opportunities"
              value={dashboardData.intTotalOpenOpportunities.toLocaleString()}
              subtitle="Active deals"
              icon={TrendingUp}
              iconColor="text-purple-600 dark:text-purple-400"
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            />
            <KpiCard
              title="Rotting Deals"
              value={dashboardData.intRottingOpportunities.toLocaleString()}
              subtitle="Needs attention"
              icon={AlertCircle}
              iconColor="text-red-600 dark:text-red-400"
              iconBgColor="bg-red-100 dark:bg-red-900/30"
            />
          </div>

          {/* KPI Cards Row 2 - Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Pipeline Value"
              value={`₹${dashboardData.dblTotalPipelineValue.toLocaleString("en-IN")}`}
              subtitle="Open opportunities"
              icon={DollarSign}
              iconColor="text-emerald-600 dark:text-emerald-400"
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <KpiCard
              title="Weighted Pipeline"
              value={`₹${dashboardData.dblWeightedPipelineValue.toLocaleString("en-IN")}`}
              subtitle="Probability-adjusted"
              icon={DollarSign}
              iconColor="text-teal-600 dark:text-teal-400"
              iconBgColor="bg-teal-100 dark:bg-teal-900/30"
            />
            <KpiCard
              title="Won Revenue"
              value={`₹${dashboardData.dblWonRevenue.toLocaleString("en-IN")}`}
              subtitle="Closed deals"
              icon={TrendingUp}
              iconColor="text-green-600 dark:text-green-400"
              iconBgColor="bg-green-100 dark:bg-green-900/30"
            />
            <KpiCard
              title="Win Rate"
              value={`${dashboardData.dblWinRate.toFixed(1)}%`}
              subtitle={`Lost: ₹${dashboardData.dblLostRevenue.toLocaleString("en-IN")}`}
              icon={Target}
              iconColor="text-blue-600 dark:text-blue-400"
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
            />
          </div>

          {/* KPI Cards Row 3 - Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Avg Sales Cycle"
              value={`${dashboardData.dblAvgSalesCycleDays.toFixed(0)} days`}
              subtitle="Time to close"
              icon={Calendar}
              iconColor="text-orange-600 dark:text-orange-400"
              iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            />
            <KpiCard
              title="Sales Velocity"
              value={`₹${dashboardData.dblSalesVelocity.toLocaleString("en-IN")}`}
              subtitle="Revenue per day"
              icon={Zap}
              iconColor="text-yellow-600 dark:text-yellow-400"
              iconBgColor="bg-yellow-100 dark:bg-yellow-900/30"
            />
            <KpiCard
              title="Activities This Week"
              value={dashboardData.intActivitiesThisWeek.toLocaleString()}
              subtitle="Scheduled activities"
              icon={Calendar}
              iconColor="text-indigo-600 dark:text-indigo-400"
              iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
            />
          </div>

          <Separator />

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PipelineFunnelChart data={dashboardData.PipelineStages} />
            <RevenueTrendChart data={dashboardData.RevenueByMonth} />
          </div>

          {/* Charts Row 2 */}
          <LeadsDistributionChart
            sourceData={dashboardData.LeadsBySource}
            statusData={dashboardData.LeadsByStatus}
          />

          {/* Lists Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopOpportunitiesList data={dashboardData.TopOpportunities} />
            <UpcomingActivitiesList data={dashboardData.UpcomingActivities} />
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

function normalizeDashboardData(input: Partial<DashboardData> | undefined): DashboardData {
  return {
    intTotalLeads: Number(input?.intTotalLeads ?? 0),
    intQualifiedLeads: Number(input?.intQualifiedLeads ?? 0),
    intTotalOpenOpportunities: Number(input?.intTotalOpenOpportunities ?? 0),
    dblTotalPipelineValue: Number(input?.dblTotalPipelineValue ?? 0),
    dblWeightedPipelineValue: Number(input?.dblWeightedPipelineValue ?? 0),
    dblWonRevenue: Number(input?.dblWonRevenue ?? 0),
    dblLostRevenue: Number(input?.dblLostRevenue ?? 0),
    dblWinRate: Number(input?.dblWinRate ?? 0),
    dblAvgSalesCycleDays: Number(input?.dblAvgSalesCycleDays ?? 0),
    dblSalesVelocity: Number(input?.dblSalesVelocity ?? 0),
    intRottingOpportunities: Number(input?.intRottingOpportunities ?? 0),
    intActivitiesThisWeek: Number(input?.intActivitiesThisWeek ?? 0),
    PipelineStages: input?.PipelineStages ?? [],
    LeadsBySource: input?.LeadsBySource ?? [],
    LeadsByStatus: input?.LeadsByStatus ?? [],
    RevenueByMonth: input?.RevenueByMonth ?? [],
    TopOpportunities: input?.TopOpportunities ?? [],
    UpcomingActivities: input?.UpcomingActivities ?? [],
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
