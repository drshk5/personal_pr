import React, { useState, useEffect } from "react";
import { useRenameSchedules } from "@/hooks/api/Account/use-rename-schedules";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { ChevronsUp, ChevronsDown, FileText, Loader2 } from "lucide-react";

import { ListModules } from "@/lib/permissions";

import type { RenameSchedule } from "@/types/central/rename-schedule";

import CustomContainer from "@/components/layout/custom-container";
import { RenameScheduleAccordion } from "@/pages/Account/rename-schedule/components/RenameScheduleAccordion";
import { RenameScheduleModal } from "@/pages/Account/rename-schedule/components/RenameScheduleModal";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const RenameSchedulesPage: React.FC = () => {
  const HeaderIcon = useMenuIcon(ListModules.ACCOUNT, FileText);

  const STORAGE_KEY = "rename-schedules-expand-all";

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandAll, setExpandAll] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved === "true";
  });
  const [isExpandingAll, setIsExpandingAll] = useState(() => {
    // Show skeleton on initial load if expandAll is true from session
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved === "true";
  });
  const [selectedRenameSchedule, setSelectedRenameSchedule] =
    useState<RenameSchedule | null>(null);

  const queryParams = { search: searchTerm };
  const {
    data: renameSchedulesData,
    isLoading,
    dataUpdatedAt,
  } = useRenameSchedules(queryParams);

  // Sync expandAll state with session storage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(expandAll));
  }, [expandAll]);

  // Clear skeleton after initial expand from session storage
  useEffect(() => {
    if (isExpandingAll && !isLoading) {
      const timer = setTimeout(() => setIsExpandingAll(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isExpandingAll, isLoading]);

  const handleEditClick = (item: RenameSchedule) => {
    setSelectedRenameSchedule(item);
    setIsEditModalOpen(true);
  };

  const toggleExpandAll = () => {
    setIsExpandingAll(true);
    const newExpandState = !expandAll;
    setExpandAll(newExpandState);
    setTimeout(() => setIsExpandingAll(false), 500);
  };

  const hierarchicalData = renameSchedulesData?.data?.items || [];

  return (
    <CustomContainer>
      <PageHeader
        title="Chart of Accounts"
        description="Manage custom names for schedules in the Chart of Accounts."
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleExpandAll}
              variant="outline"
              disabled={isExpandingAll}
            >
              {isExpandingAll ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4 text-muted-foreground" />
                  Processing...
                </>
              ) : (
                <>
                  {expandAll ? (
                    <ChevronsUp className="mr-2 h-4 w-4" />
                  ) : (
                    <ChevronsDown className="mr-2 h-4 w-4" />
                  )}
                  {expandAll ? "Collapse All" : "Expand All"}
                </>
              )}
            </Button>
          </div>
        }
      />
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <SearchInput
            placeholder="Search chart of accounts..."
            onSearchChange={setSearchTerm}
            debounceDelay={300}
            className="w-full sm:max-w-md sm:flex-1"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-2 mt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : hierarchicalData.length > 0 ? (
        <RenameScheduleAccordion
          key={`accordion-${dataUpdatedAt}`}
          data={hierarchicalData}
          onEditItem={handleEditClick}
          expandAll={expandAll}
          isLoading={isExpandingAll}
          preserveExpandedState={true}
          onExpandStateChange={(allExpanded) => {
            if (!allExpanded && expandAll) {
              setExpandAll(false);
            }
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 mt-4 text-center text-muted-foreground">
          <p>No rename schedules found.</p>
        </div>
      )}
      {isEditModalOpen && selectedRenameSchedule && (
        <RenameScheduleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRenameSchedule(null);
          }}
          renameSchedule={selectedRenameSchedule as RenameSchedule}
        />
      )}
    </CustomContainer>
  );
};
