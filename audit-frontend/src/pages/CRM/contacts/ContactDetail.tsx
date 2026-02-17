import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContact } from "@/hooks/api/CRM/use-contacts";
import { useCrmPermissions } from "@/hooks/CRM/use-crm-permissions";
import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Building2,
  Target,
  Activity,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
} from "lucide-react";

import ContactOverviewTab from "./components/ContactOverviewTab";
import ContactOpportunitiesTab from "./components/ContactOpportunitiesTab";
import ContactActivitiesTab from "./components/ContactActivitiesTab";

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const perms = useCrmPermissions("contact");

  const { data: contact, isLoading, error } = useContact(id);

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

  if (error || !contact) {
    return (
      <CustomContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <User className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Contact Not Found</h2>
          <p className="text-muted-foreground">
            The contact you're looking for doesn't exist or you don't have access.
          </p>
          <Button onClick={() => navigate("/crm/contacts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>
        </div>
      </CustomContainer>
    );
  }

  const lifecycleColors: Record<string, string> = {
    Subscriber: "bg-gray-500",
    Lead: "bg-blue-500",
    MQL: "bg-indigo-500",
    SQL: "bg-purple-500",
    Opportunity: "bg-amber-500",
    Customer: "bg-green-500",
    Evangelist: "bg-emerald-500",
  };

  return (
    <CustomContainer>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/crm/contacts")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {contact.strFirstName} {contact.strLastName}
                  </h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {contact.strJobTitle && (
                      <span>{contact.strJobTitle}</span>
                    )}
                    {contact.strAccountName && (
                      <>
                        <span>•</span>
                        <button
                          className="text-primary hover:underline inline-flex items-center gap-1"
                          onClick={() =>
                            contact.strAccountGUID &&
                            navigate(`/crm/accounts/${contact.strAccountGUID}`)
                          }
                        >
                          <Building2 className="h-3 w-3" />
                          {contact.strAccountName}
                        </button>
                      </>
                    )}
                    <span>•</span>
                    <Badge
                      className={`${
                        lifecycleColors[contact.strLifecycleStage] || "bg-gray-500"
                      } text-white`}
                    >
                      {contact.strLifecycleStage}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {perms.canEdit && (
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              {contact.strEmail && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${contact.strEmail}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {contact.strPhone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${contact.strPhone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Account
                  </p>
                  <h3 className="text-lg font-bold truncate text-foreground">
                    {contact.strAccountName || "None"}
                  </h3>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Opportunities
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {contact.opportunities?.length || 0}
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
                    Recent Activities
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {contact.recentActivities?.length || 0}
                  </h3>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Opportunities
              <Badge variant="secondary" className="ml-1">
                {contact.opportunities?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ContactOverviewTab contact={contact} canEdit={perms.canEdit} />
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <ContactOpportunitiesTab
              contactId={contact.strContactGUID}
              opportunities={contact.opportunities || []}
              canEdit={perms.canEdit}
            />
          </TabsContent>

          <TabsContent value="activities" className="space-y-6">
            <ContactActivitiesTab
              contactId={contact.strContactGUID}
              contactName={`${contact.strFirstName} ${contact.strLastName}`}
              canEdit={perms.canEdit}
            />
          </TabsContent>
        </Tabs>
      </div>
    </CustomContainer>
  );
}
