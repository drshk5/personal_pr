import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "@/hooks/api/CRM/use-accounts";
import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Users,
  Target,
  Activity,
  FileText,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  DollarSign,
} from "lucide-react";

import AccountOverviewTab from "./components/AccountOverviewTab";
import AccountContactsTab from "./components/AccountContactsTab";
import AccountOpportunitiesTab from "./components/AccountOpportunitiesTab";
import RelatedActivitiesTab from "@/pages/CRM/components/RelatedActivitiesTab";
import AccountFilesTab from "./components/AccountFilesTab";

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: account, isLoading, error } = useAccount(id);

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

  if (error || !account) {
    return (
      <CustomContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Account Not Found</h2>
          <p className="text-muted-foreground">
            The account you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/crm/accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/crm/accounts")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{account.strAccountName}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {account.strIndustry && (
                      <Badge variant="secondary">{account.strIndustry}</Badge>
                    )}
                    <span>•</span>
                    <span>Owner: {account.strAssignedToName || "Unassigned"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/crm/accounts/${id}?mode=edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {account.strEmail && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${account.strEmail}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {account.strPhone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${account.strPhone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contacts</p>
                  <h3 className="text-2xl font-bold text-foreground">{account.intContactCount}</h3>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Open Opportunities
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {account.intOpenOpportunityCount}
                  </h3>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Value
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    ${account.dblTotalOpportunityValue?.toLocaleString() || 0}
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
                    Activities
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {account.intActivityCount}
                  </h3>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contacts
              <Badge variant="secondary" className="ml-1">
                {account.intContactCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunities
              <Badge variant="secondary" className="ml-1">
                {account.intTotalOpportunityCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AccountOverviewTab account={account} />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <AccountContactsTab
              accountId={account.strAccountGUID}
              accountName={account.strAccountName}
            />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <AccountOpportunitiesTab
              accountId={account.strAccountGUID}
              accountName={account.strAccountName}
            />
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <RelatedActivitiesTab
              entityType="Account"
              entityId={account.strAccountGUID}
              entityName={account.strAccountName}
              canEdit={true}
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <AccountFilesTab accountId={account.strAccountGUID} />
          </TabsContent>
        </Tabs>
      </div>
    </CustomContainer>
  );
}
