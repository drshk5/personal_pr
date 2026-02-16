/**
 * CRM Dashboard TypeScript Types
 * Matches backend DTOs for type safety
 */

export interface DashboardData {
  // Lead KPIs
  intTotalLeads: number;
  intQualifiedLeads: number;
  LeadsBySource: LeadsBySource[];
  LeadsByStatus: LeadsByStatus[];

  // Opportunity KPIs
  intTotalOpenOpportunities: number;
  dblTotalPipelineValue: number;
  dblWeightedPipelineValue: number;
  intRottingOpportunities: number;
  PipelineStages: PipelineStageSummary[];
  TopOpportunities: TopOpportunity[];

  // Revenue KPIs
  dblWonRevenue: number;
  dblLostRevenue: number;
  dblWinRate: number;
  RevenueByMonth: RevenueByMonth[];

  // Performance KPIs
  dblAvgSalesCycleDays: number;
  dblSalesVelocity: number;

  // Activity KPIs
  intActivitiesThisWeek: number;
  UpcomingActivities: UpcomingActivity[];
}

export interface DashboardKpis {
  intTotalLeads: number;
  intQualifiedLeads: number;
  intTotalOpenOpportunities: number;
  dblTotalPipelineValue: number;
  dblWeightedPipelineValue: number;
  dblWonRevenue: number;
  dblLostRevenue: number;
  dblWinRate: number;
  dblAvgSalesCycleDays: number;
  dblSalesVelocity: number;
  intRottingOpportunities: number;
  intActivitiesThisWeek: number;
}

export interface DashboardCharts {
  PipelineStages: PipelineStageSummary[];
  LeadsBySource: LeadsBySource[];
  LeadsByStatus: LeadsByStatus[];
  RevenueByMonth: RevenueByMonth[];
  TopOpportunities: TopOpportunity[];
  UpcomingActivities: UpcomingActivity[];
}

export interface LeadsBySource {
  strSource: string;
  intCount: number;
}

export interface LeadsByStatus {
  strStatus: string;
  intCount: number;
}

export interface PipelineStageSummary {
  strStageName: string;
  intCount: number;
  dblTotalValue: number;
  intRottingCount: number;
}

export interface RevenueByMonth {
  strMonth: string;
  dblWonAmount: number;
  dblLostAmount: number;
}

export interface TopOpportunity {
  strOpportunityGUID: string;
  strOpportunityName: string;
  dblAmount: number | null;
  strStageName: string;
  strAccountName: string | null;
}

export interface UpcomingActivity {
  strActivityGUID: string;
  strActivityType: string;
  strSubject: string;
  dtScheduledOn: string | null;
  strEntityName: string | null;
}

export interface PerformanceMetrics {
  responseTimeMs: number;
  cacheStatus: 'HIT' | 'MISS' | 'REFRESHED';
  timestamp: Date;
}
