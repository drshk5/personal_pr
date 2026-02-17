import RelatedActivitiesTab from "@/pages/CRM/components/RelatedActivitiesTab";

interface ContactActivitiesTabProps {
  contactId: string;
  contactName: string;
  canEdit: boolean;
}

export default function ContactActivitiesTab({
  contactId,
  contactName,
  canEdit,
}: ContactActivitiesTabProps) {
  return (
    <RelatedActivitiesTab
      entityType="Contact"
      entityId={contactId}
      entityName={contactName}
      canEdit={canEdit}
    />
  );
}
