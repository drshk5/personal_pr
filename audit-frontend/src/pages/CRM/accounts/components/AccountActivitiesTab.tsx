import RelatedActivitiesTab from "@/pages/CRM/components/RelatedActivitiesTab";

interface AccountActivitiesTabProps {
  accountId: string;
  accountName: string;
  canEdit?: boolean;
}

export default function AccountActivitiesTab({
  accountId,
  accountName,
  canEdit = true,
}: AccountActivitiesTabProps) {
  return (
    <RelatedActivitiesTab
      entityType="Account"
      entityId={accountId}
      entityName={accountName}
      canEdit={canEdit}
    />
  );
}
