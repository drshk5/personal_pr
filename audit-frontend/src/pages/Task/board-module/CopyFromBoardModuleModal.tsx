import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";

import type { Board } from "@/types/task/board";
import type { BoardSection } from "@/types/task/board-section";

import { useBoardSectionsByBoardGuid } from "@/hooks/api/task/use-board-sections";
import { useCopyFromBoardSections } from "@/hooks/api/task/use-board-sections";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { Label } from "@/components/ui/label";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Separator } from "@/components/ui/separator";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  DocumentTable,
  type DocumentTableColumn,
} from "@/components/data-display/data-tables/CheckboxDataTable";

interface CopyFromBoardModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetBoardGuid?: string;
  boards: Board[];
  onSuccess?: () => void;
}

export function CopyFromBoardModuleModal({
  open,
  onOpenChange,
  targetBoardGuid,
  boards,
  onSuccess,
}: CopyFromBoardModuleModalProps) {
  const [sourceBoardGuid, setSourceBoardGuid] = useState<string>("");
  const [selectedTargetBoardGuid, setSelectedTargetBoardGuid] =
    useState<string>("");
  const [selectedSectionGuids, setSelectedSectionGuids] = useState<string[]>(
    []
  );
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);

  const copyFromMutation = useCopyFromBoardSections();

  const targetBoards = useMemo(
    () => boards.filter((board) => board.strBoardGUID !== sourceBoardGuid),
    [boards, sourceBoardGuid]
  );

  const { data: sourceSectionsResponse, isLoading: isSectionsLoading } =
    useBoardSectionsByBoardGuid(
      sourceBoardGuid || undefined,
      {
        pageNumber: 1,
        pageSize: 1000,
      },
      open && !!sourceBoardGuid
    );

  const sourceSections = sourceSectionsResponse?.data || [];
  const hasSections = sourceSections.length > 0;

  useEffect(() => {
    if (open) {
      setSelectedTargetBoardGuid(targetBoardGuid || "");
    }
  }, [open, targetBoardGuid]);

  const handleSelectAll = (checked: boolean) => {
    setIndeterminate(false);
    setSelectAll(checked);

    if (checked) {
      setSelectedSectionGuids(
        sourceSections.map((section) => section.strBoardSectionGUID)
      );
    } else {
      setSelectedSectionGuids([]);
    }
  };

  const handleRowSelection = (sectionGuid: string) => {
    setSelectedSectionGuids((prev) => {
      if (prev.includes(sectionGuid)) {
        return prev.filter((guid) => guid !== sectionGuid);
      }
      return [...prev, sectionGuid];
    });
  };

  useEffect(() => {
    const selectedCount = selectedSectionGuids.length;

    if (hasSections) {
      if (selectedCount === sourceSections.length) {
        setSelectAll(true);
        setIndeterminate(false);
      } else if (selectedCount > 0) {
        setSelectAll(false);
        setIndeterminate(true);
      } else {
        setSelectAll(false);
        setIndeterminate(false);
      }
    }
  }, [sourceSections.length, selectedSectionGuids, hasSections]);

  const resetState = useCallback(() => {
    setSourceBoardGuid("");
    setSelectedTargetBoardGuid(targetBoardGuid || "");
    setSelectedSectionGuids([]);
    setSelectAll(false);
    setIndeterminate(false);
  }, [targetBoardGuid]);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const handleCopyFrom = async () => {
    if (!selectedTargetBoardGuid) {
      toast.error("Please select a target project first");
      return;
    }
    if (!sourceBoardGuid) {
      toast.error("Please select a source project");
      return;
    }
    if (sourceBoardGuid === selectedTargetBoardGuid) {
      toast.error("Source and target project cannot be the same");
      return;
    }

    await copyFromMutation.mutateAsync({
      targetBoardGuid: selectedTargetBoardGuid,
      request: {
        strSourceBoardGUID: sourceBoardGuid,
        ...(selectedSectionGuids.length
          ? { strSectionGUIDs: selectedSectionGuids }
          : {}),
      },
    });

    handleClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
      title="Copy Modules From Project"
      description="Select source and target projects, then choose which modules to copy."
      maxWidth="900px"
      className="h-[85vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw]"
      showCloseButton={false}
      preventOutsideClick={true}
      footerContent={
        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            onClick={handleCopyFrom}
            disabled={
              !selectedTargetBoardGuid ||
              !sourceBoardGuid ||
              copyFromMutation.isPending
            }
            className="text-xs sm:text-sm"
          >
            {copyFromMutation.isPending ? "Copying..." : "Copy Modules"}
          </Button>
        </div>
      }
    >
      <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50">
        <button
          className="h-8 w-8 p-0 cursor-pointer"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-4.5 w-4" />
        </button>
      </div>

      <div className="w-full px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
        <div className="flex flex-col space-y-4 h-full">
          {/* Form Section */}
          <div className="shrink-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Source Project <span className="text-red-500">*</span>
                </Label>
                <PreloadedSelect
                  options={boards.map((board) => ({
                    value: board.strBoardGUID,
                    label: board.strName || "Unnamed project",
                  }))}
                  selectedValue={sourceBoardGuid}
                  onChange={(value) => {
                    setSourceBoardGuid(value);
                    setSelectedSectionGuids([]);
                  }}
                  placeholder="Select a source project"
                  clearable={false}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Target Project <span className="text-red-500">*</span>
                </Label>
                <PreloadedSelect
                  options={targetBoards.map((board) => ({
                    value: board.strBoardGUID,
                    label: board.strName || "Unnamed project",
                  }))}
                  selectedValue={selectedTargetBoardGuid || ""}
                  onChange={(value) => {
                    setSelectedTargetBoardGuid(value);
                    setSelectedSectionGuids([]);
                  }}
                  placeholder={
                    !sourceBoardGuid
                      ? "Select source first"
                      : "Select a target project"
                  }
                  disabled={!sourceBoardGuid}
                  clearable={false}
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <Separator className="my-2" />

          {/* Table Section */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <div className="shrink-0">
              <Label className="text-sm font-medium">
                Available Modules
                {selectedSectionGuids.length > 0 && (
                  <span className="ml-2 text-muted-foreground text-xs font-normal">
                    ({selectedSectionGuids.length} selected)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex-1 min-h-0 rounded-md border border-border-color overflow-hidden">
              <DocumentTable<BoardSection>
                data={sourceSections}
                columns={
                  [
                    {
                      key: "actions",
                      width: "80px",
                      header: (
                        <div className="flex items-center justify-start h-full p-2">
                          <IndeterminateCheckbox
                            checked={selectAll}
                            indeterminate={indeterminate}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                            disabled={!hasSections || isSectionsLoading}
                          />
                        </div>
                      ),
                      cell: (section: BoardSection) => (
                        <div className="flex items-center justify-start h-full p-2">
                          <Checkbox
                            checked={selectedSectionGuids.includes(
                              section.strBoardSectionGUID
                            )}
                            onCheckedChange={() =>
                              handleRowSelection(section.strBoardSectionGUID)
                            }
                            aria-label={`Select ${section.strName}`}
                          />
                        </div>
                      ),
                      sortable: false,
                    },
                    {
                      key: "strName",
                      header: "Module Name",
                      width: "300px",
                      cell: (section: BoardSection) => (
                        <div className="font-medium text-sm">
                          {section.strName || "Unnamed"}
                        </div>
                      ),
                      sortable: false,
                    },
                  ] as DocumentTableColumn<BoardSection>[]
                }
                keyExtractor={(item) => item.strBoardSectionGUID}
                maxHeight="240px"
                loading={isSectionsLoading}
                emptyState={
                  !sourceBoardGuid
                    ? "Select a source project to view modules."
                    : "No modules found in the selected project."
                }
              />
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
