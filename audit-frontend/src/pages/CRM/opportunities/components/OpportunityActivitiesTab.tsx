import RelatedActivitiesTab from "@/pages/CRM/components/RelatedActivitiesTab";

interface OpportunityActivitiesTabProps {
  opportunityId: string;
  opportunityName: string;
  canEdit: boolean;
}

export default function OpportunityActivitiesTab({
  opportunityId,
  opportunityName,
  canEdit,
}: OpportunityActivitiesTabProps) {
  return (
    <RelatedActivitiesTab
      entityType="Opportunity"
      entityId={opportunityId}
      entityName={opportunityName}
      canEdit={canEdit}
    />
  );
}
