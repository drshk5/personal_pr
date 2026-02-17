import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOpportunity } from "@/hooks/api/CRM/use-opportunities";
import { usePipelines } from "@/hooks/api/CRM/use-pipelines";
import { useCrmPermissions } from "@/hooks/CRM/use-crm-permissions";
import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Users,
  Activity,
  ArrowLeft,
  Edit,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";

import OpportunityOverviewTab from "./components/OpportunityOverviewTab";
import OpportunityContactsTab from "./components/OpportunityContactsTab";
import OpportunityActivitiesTab from "./components/OpportunityActivitiesTab";
import OpportunityStagePipeline from "./components/OpportunityStagePipeline";

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const perms = useCrmPermissions("opportunity");

  const { data: opportunity, isLoading, error } = useOpportunity(id);
  const { data: pipelinesData } = usePipelines();
  const pipelines = pipelinesData || [];

  if (isLoading) {
    return (
      <CustomContainer>
        <div className="space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </CustomContainer>
    );
  }

  if (error || !opportunity) {
    return (
      <CustomContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Target className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Opportunity Not Found</h2>
          <p className="text-muted-foreground">
            The opportunity you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/crm/opportunities")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opportunities
          </Button>
        </div>
      </CustomContainer>
    );
  }

  const statusColors: Record<string, string> = {
    Open: "bg-blue-500",
    Won: "bg-green-500",
    Lost: "bg-red-500",
  };

  const StatusIcon = opportunity.strStatus === "Won"
    ? CheckCircle2
    : opportunity.strStatus === "Lost"
    ? XCircle
    : opportunity.bolIsRotting
    ? AlertTriangle
    : Target;

  return (
    <CustomContainer>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/crm/opportunities")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Opportunities
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <StatusIcon
                  className={`h-8 w-8 ${
                    opportunity.strStatus === "Won"
                      ? "text-green-500"
                      : opportunity.strStatus === "Lost"
                      ? "text-red-500"
                      : opportunity.bolIsRotting
                      ? "text-amber-500"
                      : "text-primary"
                  }`}
                />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {opportunity.strOpportunityName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {opportunity.strAccountName && (
                      <button
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        onClick={() =>
                          opportunity.strAccountGUID &&
                          navigate(`/crm/accounts/${opportunity.strAccountGUID}`)
                        }
                      >
                        <Building2 className="h-3 w-3" />
                        {opportunity.strAccountName}
                      </button>
                    )}
                    <span>•</span>
                    <Badge
                      className={`${
                        statusColors[opportunity.strStatus] || "bg-gray-500"
                      } text-white`}
                    >
                      {opportunity.strStatus}
                    </Badge>
                    <span>•</span>
                    <Badge variant="outline">{opportunity.strStageName}</Badge>
                    {opportunity.bolIsRotting && (
                      <>
                        <span>•</span>
                        <Badge className="bg-amber-500 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Rotting
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {perms.canEdit && opportunity.strStatus === "Open" && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("overview")}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline Stage Visualization */}
        {opportunity.strStatus === "Open" && (
          <OpportunityStagePipeline
            opportunity={opportunity}
            pipelines={pipelines}
            canEdit={perms.canEdit}
          />
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Deal Value
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {opportunity.strCurrency}{" "}
                    {opportunity.dblAmount?.toLocaleString() || 0}
                  </h3>
                </div>
                <DollarSign className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Probability
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {opportunity.intProbability}%
                  </h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Days in Stage
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {opportunity.intDaysInStage}
                  </h3>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Contacts
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {opportunity.contacts?.length || 0}
                  </h3>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
              <Badge variant="secondary" className="ml-1">
                {opportunity.contacts?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OpportunityOverviewTab
              opportunity={opportunity}
              canEdit={perms.canEdit}
            />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <OpportunityContactsTab
              opportunityId={opportunity.strOpportunityGUID}
              contacts={opportunity.contacts || []}
              canEdit={perms.canEdit}
            />
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <OpportunityActivitiesTab
              opportunityId={opportunity.strOpportunityGUID}
              opportunityName={opportunity.strOpportunityName}
              canEdit={perms.canEdit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </CustomContainer>
  );
}
