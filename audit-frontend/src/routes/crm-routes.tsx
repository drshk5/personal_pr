import React, { Suspense, lazy } from "react";
import { PageLoader } from "@/components/layout/page-loader";

const Dashboard = lazy(() => import("@/pages/CRM/dashboard"));
const LeadList = lazy(() => import("@/pages/CRM/leads/LeadList"));
const LeadForm = lazy(() => import("@/pages/CRM/leads/LeadForm"));
const ContactList = lazy(() => import("@/pages/CRM/contacts/ContactList"));
const ContactForm = lazy(() => import("@/pages/CRM/contacts/ContactForm"));
const AccountList = lazy(() => import("@/pages/CRM/accounts/AccountList"));
const AccountForm = lazy(() => import("@/pages/CRM/accounts/AccountForm"));
const ActivityTimeline = lazy(() => import("@/pages/CRM/activities/ActivityTimeline"));
const OpportunityList = lazy(() => import("@/pages/CRM/opportunities/OpportunityList"));
const OpportunityForm = lazy(() => import("@/pages/CRM/opportunities/OpportunityForm"));
const OpportunityBoard = lazy(() => import("@/pages/CRM/opportunities/OpportunityBoard"));
const PipelineList = lazy(() => import("@/pages/CRM/pipelines/PipelineList"));

const wrapWithSuspense = (
  Component: React.ComponentType
): React.ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const getCrmRouteElement = (
  mapKey: string
): React.ReactElement | null => {
  const normalizedKey = mapKey.toLowerCase();

  switch (normalizedKey) {
    case "crm_dashboard":
      return wrapWithSuspense(Dashboard);
    case "crm_lead_list":
      return wrapWithSuspense(LeadList);
    case "crm_lead_form":
      return wrapWithSuspense(LeadForm);
    case "crm_contact_list":
      return wrapWithSuspense(ContactList);
    case "crm_contact_form":
      return wrapWithSuspense(ContactForm);
    case "crm_account_list":
      return wrapWithSuspense(AccountList);
    case "crm_account_form":
      return wrapWithSuspense(AccountForm);
    case "crm_activity_list":
      return wrapWithSuspense(ActivityTimeline);
    case "crm_opportunity_list":
      return wrapWithSuspense(OpportunityList);
    case "crm_opportunity_form":
      return wrapWithSuspense(OpportunityForm);
    case "crm_opportunity_board":
      return wrapWithSuspense(OpportunityBoard);
    case "crm_pipeline_list":
      return wrapWithSuspense(PipelineList);

    default:
      return null;
  }
};
