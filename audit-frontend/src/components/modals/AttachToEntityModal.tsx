import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useJournalVouchersDropdown } from "@/hooks/api/Account/use-journal-voucher";
import { useInvoicesDropdown } from "@/hooks/api/Account/use-sales-invoices";
import { useActivePartiesByType } from "@/hooks/api/Account/use-parties";
import { useBulkAssignDocuments } from "@/hooks/api/central/use-documents";
import { Info } from "lucide-react";

interface AttachToEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  documentFileName?: string;
  documentId?: string;
  documentIds?: string[];
  documentCount?: number;
}

export const AttachToEntityModal = ({
  open,
  onOpenChange,
  entityType,
  documentFileName,
  documentId,
  documentIds,
  documentCount,
}: AttachToEntityModalProps) => {
  const [selectedEntityGuid, setSelectedEntityGuid] = useState<string>("");

  const bulkAssignDocumentsMutation = useBulkAssignDocuments();

  // Determine which document IDs to use
  const targetDocumentIds = documentIds || (documentId ? [documentId] : []);
  const displayCount = documentCount || targetDocumentIds.length;

  // Conditionally fetch data based on entity type and modal open state
  const { data: journalVouchers, isLoading: isLoadingJV } =
    useJournalVouchersDropdown(undefined, {
      enabled: open && entityType === "Journal Voucher",
    });

  const { data: invoices, isLoading: isLoadingInv } = useInvoicesDropdown(
    undefined,
    {
      enabled: open && entityType === "Invoice",
    }
  );

  const { data: parties, isLoading: isLoadingParty } = useActivePartiesByType(
    {
      strPartyType: "Customer", // Default party type, you can make this dynamic if needed
    },
    open && entityType === "Party"
  );

  const isLoading =
    isLoadingJV ||
    isLoadingInv ||
    isLoadingParty ||
    bulkAssignDocumentsMutation.isPending;

  // Prepare options based on entity type
  const getOptions = () => {
    switch (entityType) {
      case "Journal Voucher":
        return (
          journalVouchers?.map((jv) => ({
            value: jv.strJournal_VoucherGUID,
            label: `${jv.strJournal_VoucherNo} (${jv.intTotalDocuments})`,
          })) || []
        );
      case "Invoice":
        return (
          invoices?.map((inv) => ({
            value: inv.strInvoiceGUID,
            label: `${inv.strInvoiceNo} (${inv.intTotalDocuments})`,
          })) || []
        );
      case "Party":
        return (
          parties?.map((party) => ({
            value: party.strPartyGUID,
            label: party.strPartyName_Display || "Unknown",
          })) || []
        );
      default:
        return [];
    }
  };

  const handleAttach = async () => {
    if (selectedEntityGuid && targetDocumentIds.length > 0) {
      const selectedOption = getOptions().find(
        (opt) => opt.value === selectedEntityGuid
      );
      await bulkAssignDocumentsMutation.mutateAsync(
        {
          strDocumentGUIDs: targetDocumentIds,
          strEntityGUID: selectedEntityGuid,
          strEntityName: entityType,
          strEntityValue: selectedOption?.label || "",
        },
        {
          onSettled: () => {
            setSelectedEntityGuid("");
            onOpenChange(false);
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setSelectedEntityGuid("");
    onOpenChange(false);
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Attach File(s) to ${entityType}`}
      maxWidth="500px"
      footerContent={
        <>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleAttach}
            disabled={!selectedEntityGuid || isLoading}
          >
            Attach
          </Button>
        </>
      }
    >
      <div className="space-y-4 px-6 py-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Select {entityType}
          </label>
          <PreloadedSelect
            options={getOptions()}
            selectedValue={selectedEntityGuid}
            onChange={(value) => setSelectedEntityGuid(value)}
            placeholder={`Select ${entityType}`}
            isLoading={isLoading}
            disabled={isLoading}
            clearable={false}
            queryKey={
              entityType === "Journal Voucher"
                ? ["journalVouchers", "dropdown"]
                : entityType === "Invoice"
                  ? ["invoices", "dropdown"]
                  : entityType === "Party"
                    ? ["parties", "dropdown", "Customer"]
                    : undefined
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Selected Document(s) : ({displayCount})
          </label>
          {documentFileName ? (
            <p className="text-sm text-muted-foreground">{documentFileName}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {displayCount} document{displayCount !== 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Maximum 5 documents can be attached to a single entity.
          </p>
        </div>
      </div>
    </ModalDialog>
  );
};
