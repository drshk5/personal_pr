import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import type { Board } from "@/types/task/board";
import type { BoardSection } from "@/types/task/board-section";
import type { BoardSubModule } from "@/types/task/board-sub-module";
import { useActiveBoards } from "@/hooks/api/task/use-board";
import {
  useBoardSection,
  useBoardSectionsByBoardGuid,
} from "@/hooks/api/task/use-board-sections";
import { useBoardSubModulesBySection } from "@/hooks/api/task/use-board-sub-module";
import { useCopyFromBoardSubModules } from "@/hooks/api/task/use-board-sub-module";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IndeterminateCheckbox } from "@/components/ui/IndeterminateCheckbox";
import { Label } from "@/components/ui/label";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Separator } from "@/components/ui/separator";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { DocumentTable } from "@/components/data-display/data-tables/CheckboxDataTable";

interface CopyFromBoardSubModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetBoardSectionGuid?: string;
  boardGuid?: string;
  onSuccess?: () => void;
}

export function CopyFromBoardSubModuleModal({
  open,
  onOpenChange,
  targetBoardSectionGuid,
  boardGuid,
  onSuccess,
}: CopyFromBoardSubModuleModalProps) {
  const [sourceBoardGuid, setSourceBoardGuid] = useState<string>("");
  const [selectedTargetBoardGuid, setSelectedTargetBoardGuid] =
    useState<string>("");
  const [sourceBoardSectionGuid, setSourceBoardSectionGuid] =
    useState<string>("");
  const [selectedTargetBoardSectionGuid, setSelectedTargetBoardSectionGuid] =
    useState<string>("");
  const [selectedSubModuleGuids, setSelectedSubModuleGuids] = useState<
    string[]
  >([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [indeterminate, setIndeterminate] = useState<boolean>(false);

  const copyFromMutation = useCopyFromBoardSubModules();

  const { data: boards = [] } = useActiveBoards(undefined, {
    enabled: open,
  });

  const { data: targetBoardSection } = useBoardSection(
    !boardGuid && targetBoardSectionGuid ? targetBoardSectionGuid : undefined,
    open
  );

  const effectiveTargetBoardGuid =
    boardGuid || targetBoardSection?.strBoardGUID;

  const { data: sourceSectionsResponse, isLoading: isSourceSectionsLoading } =
    useBoardSectionsByBoardGuid(
      sourceBoardGuid || undefined,
      {
        pageNumber: 1,
        pageSize: 1000,
      },
      open && !!sourceBoardGuid
    );

  const { data: targetSectionsResponse, isLoading: isTargetSectionsLoading } =
    useBoardSectionsByBoardGuid(
      selectedTargetBoardGuid || effectiveTargetBoardGuid || undefined,
      {
        pageNumber: 1,
        pageSize: 1000,
      },
      open && !!(selectedTargetBoardGuid || effectiveTargetBoardGuid)
    );

  const sourceBoardSections = sourceSectionsResponse?.data || [];
  const targetBoardSections = targetSectionsResponse?.data || [];

  const { data: sourceSubModulesResponse, isLoading: isSubModulesLoading } =
    useBoardSubModulesBySection(
      sourceBoardSectionGuid || undefined,
      {
        pageNumber: 1,
        pageSize: 1000,
      },
      !!sourceBoardSectionGuid
    );

  const sourceSubModules = sourceSubModulesResponse?.data || [];
  const hasSubModules = sourceSubModules.length > 0;

  useEffect(() => {
    if (open) {
      if (effectiveTargetBoardGuid) {
        setSelectedTargetBoardGuid(effectiveTargetBoardGuid);
      }
      setSelectedTargetBoardSectionGuid(targetBoardSectionGuid || "");
    }
  }, [open, targetBoardSectionGuid, effectiveTargetBoardGuid]);

  useEffect(() => {
    if (open && targetBoardSection?.strBoardGUID) {
      setSelectedTargetBoardGuid(targetBoardSection.strBoardGUID);
    }
  }, [open, targetBoardSection?.strBoardGUID]);

  const handleSelectAll = (checked: boolean) => {
    setIndeterminate(false);
    setSelectAll(checked);

    if (checked) {
      setSelectedSubModuleGuids(
        sourceSubModules.map((subModule) => subModule.strBoardSubModuleGUID)
      );
    } else {
      setSelectedSubModuleGuids([]);
    }
  };

  const handleRowSelection = (subModuleGuid: string) => {
    setSelectedSubModuleGuids((prev) => {
      if (prev.includes(subModuleGuid)) {
        return prev.filter((guid) => guid !== subModuleGuid);
      }
      return [...prev, subModuleGuid];
    });
  };

  useEffect(() => {
    const selectedCount = selectedSubModuleGuids.length;

    if (hasSubModules) {
      if (selectedCount === sourceSubModules.length) {
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
  }, [sourceSubModules.length, selectedSubModuleGuids, hasSubModules]);

  const resetState = useCallback(() => {
    setSourceBoardGuid("");
    setSelectedTargetBoardGuid("");
    setSourceBoardSectionGuid("");
    setSelectedTargetBoardSectionGuid(targetBoardSectionGuid || "");
    setSelectedSubModuleGuids([]);
    setSelectAll(false);
    setIndeterminate(false);
  }, [targetBoardSectionGuid]);

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
    if (!sourceBoardGuid) {
      toast.error("Please select a source project");
      return;
    }
    if (!selectedTargetBoardGuid && !effectiveTargetBoardGuid) {
      toast.error("Please select a target project");
      return;
    }
    if (!selectedTargetBoardSectionGuid) {
      toast.error("Please select a target module first");
      return;
    }
    if (!sourceBoardSectionGuid) {
      toast.error("Please select a source module");
      return;
    }
    if (sourceBoardSectionGuid === selectedTargetBoardSectionGuid) {
      toast.error("Source and target module cannot be the same");
      return;
    }

    await copyFromMutation.mutateAsync({
      targetBoardSectionGuid: selectedTargetBoardSectionGuid,
      request: {
        strSourceBoardSectionGUID: sourceBoardSectionGuid,
        ...(selectedSubModuleGuids.length
          ? { strSubModuleGUIDs: selectedSubModuleGuids }
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
      title="Copy Sub Modules From Module"
      description="Select source and target modules, then choose which sub modules to copy."
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
              !selectedTargetBoardSectionGuid ||
              !sourceBoardSectionGuid ||
              copyFromMutation.isPending
            }
            className="text-xs sm:text-sm"
          >
            {copyFromMutation.isPending ? "Copying..." : "Copy Sub Modules"}
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
                  options={boards.map((board: Board) => ({
                    value: board.strBoardGUID,
                    label: board.strName || "Unnamed project",
                  }))}
                  selectedValue={sourceBoardGuid}
                  onChange={(value) => {
                    setSourceBoardGuid(value);
                    setSourceBoardSectionGuid("");
                    setSelectedSubModuleGuids([]);
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
                  options={boards.map((board: Board) => ({
                    value: board.strBoardGUID,
                    label: board.strName || "Unnamed project",
                  }))}
                  selectedValue={selectedTargetBoardGuid || ""}
                  onChange={(value) => {
                    setSelectedTargetBoardGuid(value);
                    setSelectedTargetBoardSectionGuid("");
                    setSelectedSubModuleGuids([]);
                  }}
                  placeholder="Select a target project"
                  clearable={false}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Source Module <span className="text-red-500">*</span>
                </Label>
                <PreloadedSelect
                  options={sourceBoardSections.map((section: BoardSection) => ({
                    value: section.strBoardSectionGUID,
                    label: section.strName || "Unnamed module",
                  }))}
                  selectedValue={sourceBoardSectionGuid}
                  onChange={(value) => {
                    setSourceBoardSectionGuid(value);
                    setSelectedSubModuleGuids([]);
                  }}
                  placeholder={
                    !sourceBoardGuid
                      ? "Select source project first"
                      : isSourceSectionsLoading
                        ? "Loading modules..."
                        : "Select a source module"
                  }
                  disabled={!sourceBoardGuid}
                  clearable={false}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Target Module <span className="text-red-500">*</span>
                </Label>
                <PreloadedSelect
                  options={targetBoardSections.map((section: BoardSection) => ({
                    value: section.strBoardSectionGUID,
                    label: section.strName || "Unnamed module",
                  }))}
                  selectedValue={selectedTargetBoardSectionGuid || ""}
                  onChange={(value) => {
                    setSelectedTargetBoardSectionGuid(value);
                    setSelectedSubModuleGuids([]);
                  }}
                  placeholder={
                    !selectedTargetBoardGuid && !effectiveTargetBoardGuid
                      ? "Select target project first"
                      : isTargetSectionsLoading
                        ? "Loading modules..."
                        : "Select a target module"
                  }
                  disabled={
                    !selectedTargetBoardGuid && !effectiveTargetBoardGuid
                  }
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
                Available Sub Modules
                {selectedSubModuleGuids.length > 0 && (
                  <span className="ml-2 text-muted-foreground text-xs font-normal">
                    ({selectedSubModuleGuids.length} selected)
                  </span>
                )}
              </Label>
            </div>

            <div className="flex-1 min-h-0 rounded-md border border-border-color overflow-hidden">
              <DocumentTable
                data={sourceSubModules}
                columns={[
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
                          disabled={!hasSubModules || isSubModulesLoading}
                        />
                      </div>
                    ),
                    cell: (subModule: BoardSubModule) => (
                      <div className="flex items-center justify-start h-full p-2">
                        <Checkbox
                          checked={selectedSubModuleGuids.includes(
                            subModule.strBoardSubModuleGUID
                          )}
                          onCheckedChange={() =>
                            handleRowSelection(subModule.strBoardSubModuleGUID)
                          }
                          aria-label={`Select ${subModule.strName}`}
                        />
                      </div>
                    ),
                    sortable: false,
                  },
                  {
                    key: "strName",
                    header: "Sub Module Name",
                    width: "300px",
                    cell: (subModule: BoardSubModule) => (
                      <div className="font-medium text-sm">
                        {subModule.strName || "Unnamed"}
                      </div>
                    ),
                    sortable: false,
                  },
                ]}
                keyExtractor={(item) => item.strBoardSubModuleGUID}
                maxHeight="240px"
                loading={isSubModulesLoading}
                emptyState={
                  !sourceBoardSectionGuid
                    ? "Select a source module to view sub modules."
                    : "No sub modules found in the selected module."
                }
              />
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
