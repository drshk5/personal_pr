import { useState, useEffect, useRef } from "react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBulkCreateTasks } from "@/hooks/api/task/use-task";
import { useActiveOrganizations } from "@/hooks/api/central/use-organizations";
import { useYearsByOrganization } from "@/hooks/api/central/use-years";
import type { BulkTaskCreateOrganization } from "@/types/task/task";
import type { Organization } from "@/types/central/organization";
import type { YearSimple } from "@/types/central/year";

interface YearSelection {
  strYearGUID: string;
  strYear: string;
  bolIsSelected: boolean;
}

interface OrganizationWithYears {
  strOrgGUID: string;
  strOrgName: string;
  bolIsSelected: boolean;
  years: YearSelection[];
  isLoadingYears?: boolean;
}

interface BulkCreateTaskModalProps {
  taskGUID: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCreateTaskModal({
  taskGUID,
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateTaskModalProps) {
  const bulkCreateMutation = useBulkCreateTasks();
  const { data: organizationsData, isLoading: isLoadingOrganizations } =
    useActiveOrganizations({ enabled: open });

  const [organizations, setOrganizations] = useState<OrganizationWithYears[]>(
    []
  );
  const loadedYearsRef = useRef<Set<string>>(new Set());

  // Convert organizations from API to our format
  useEffect(() => {
    if (organizationsData) {
      const orgs: OrganizationWithYears[] = organizationsData.map(
        (org: Organization) => ({
          strOrgGUID: org.strOrganizationGUID,
          strOrgName: org.strOrganizationName,
          bolIsSelected: false,
          years: [],
          isLoadingYears: false,
        })
      );
      setOrganizations(orgs);
      loadedYearsRef.current.clear();
    }
  }, [organizationsData]);

  // Component to fetch and display years for an organization
  const OrganizationYears = ({ orgGUID }: { orgGUID: string }) => {
    const { data: yearsData, isLoading } = useYearsByOrganization(orgGUID);

    useEffect(() => {
      if (yearsData && !isLoading && !loadedYearsRef.current.has(orgGUID)) {
        loadedYearsRef.current.add(orgGUID);
        setOrganizations((prev) =>
          prev.map((org) =>
            org.strOrgGUID === orgGUID
              ? {
                  ...org,
                  years: yearsData.map((year: YearSimple) => ({
                    strYearGUID: year.strYearGUID,
                    strYear: year.strName,
                    bolIsSelected: false,
                  })),
                  isLoadingYears: false,
                }
              : org
          )
        );
      }
    }, [yearsData, isLoading, orgGUID]);

    const org = organizations.find((o) => o.strOrgGUID === orgGUID);

    if (isLoading) {
      return (
        <div className="pl-9 py-4 text-sm text-muted-foreground">
          Loading years...
        </div>
      );
    }

    if (!org?.years || org.years.length === 0) {
      return (
        <div className="pl-9 py-4 text-sm text-muted-foreground">
          No years available for this organization
        </div>
      );
    }

    return (
      <div className="pl-9 space-y-2.5 pt-2">
        {org.years.map((year) => (
          <div key={year.strYearGUID} className="flex items-center gap-3">
            <Checkbox
              checked={year.bolIsSelected}
              onCheckedChange={(checked) =>
                handleYearCheckboxChange(
                  orgGUID,
                  year.strYearGUID,
                  checked as boolean
                )
              }
              disabled={isLoading}
            />
            <div className="flex-1 border border-border-color rounded-md px-4 py-2.5 bg-muted/40">
              <span className="text-sm font-medium text-foreground">
                {year.strYear}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleOrgCheckboxChange = (orgGUID: string, checked: boolean) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.strOrgGUID === orgGUID
          ? {
              ...org,
              bolIsSelected: checked,
              years: org.years.map((year) => ({
                ...year,
                bolIsSelected: checked,
              })),
            }
          : org
      )
    );
  };

  const handleYearCheckboxChange = (
    orgGUID: string,
    yearGUID: string,
    checked: boolean
  ) => {
    setOrganizations((prev) =>
      prev.map((org) => {
        if (org.strOrgGUID === orgGUID) {
          const updatedYears = org.years.map((year) =>
            year.strYearGUID === yearGUID
              ? { ...year, bolIsSelected: checked }
              : year
          );
          const allYearsSelected = updatedYears.every((y) => y.bolIsSelected);
          return {
            ...org,
            years: updatedYears,
            bolIsSelected: allYearsSelected,
          };
        }
        return org;
      })
    );
  };

  const handleSubmit = () => {
    const orgMap = new Map<string, string[]>();
    
    organizations.forEach((org) => {
      org.years.forEach((year: YearSelection) => {
        if (year.bolIsSelected) {
          if (!orgMap.has(org.strOrgGUID)) {
            orgMap.set(org.strOrgGUID, []);
          }
          orgMap.get(org.strOrgGUID)!.push(year.strYearGUID);
        }
      });
    });

    const orgRequests: BulkTaskCreateOrganization[] = Array.from(orgMap.entries()).map(
      ([strOrganizationGUID, strYearGUIDs]) => ({
        strOrganizationGUID,
        strYearGUIDs,
      })
    );

    if (orgRequests.length > 0) {
      bulkCreateMutation.mutate(
        { strTaskGUID: taskGUID, organizations: orgRequests },
        {
          onSuccess: () => {
            onOpenChange(false);
            if (onSuccess) {
              onSuccess();
            }
          },
        }
      );
    }
  };

  const handleClose = () => {
    if (!bulkCreateMutation.isPending) {
      onOpenChange(false);
    }
  };

  const hasSelection = organizations.some((org) =>
    org.years.some((year) => year.bolIsSelected)
  );

  const isLoading = bulkCreateMutation.isPending;

  const footerContent = (
    <div className="flex justify-end gap-2 w-full">
      <Button variant="outline" onClick={handleClose} disabled={isLoading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!hasSelection || isLoading}>
        {isLoading ? "Creating..." : "Create Tasks"}
      </Button>
    </div>
  );

  return (
    <ModalDialog
      open={open}
      onOpenChange={handleClose}
      title="Bulk Create Tasks"
      maxWidth="750px"
      className="h-[75vh] max-sm:h-[95vh] max-sm:w-[95vw] max-sm:max-w-[95vw] max-md:w-[90vw] max-md:max-w-[90vw] z-110"
      fullHeight={false}
      showCloseButton={true}
      footerContent={footerContent}
    >
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Organizations
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select organizations and their years to create tasks
            </p>
          </div>
          {isLoadingOrganizations ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading organizations...
            </div>
          ) : organizations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No organizations available
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-2">
              {organizations.map((org) => (
                <AccordionItem
                  key={org.strOrgGUID}
                  value={org.strOrgGUID}
                  className="border border-border-color rounded-lg bg-muted shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline py-0 px-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 w-full py-4">
                      <Checkbox
                        checked={org.bolIsSelected}
                        onCheckedChange={(checked) => {
                          handleOrgCheckboxChange(
                            org.strOrgGUID,
                            checked as boolean
                          );
                        }}
                        disabled={isLoading}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-semibold text-base text-foreground">
                        {org.strOrgName}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 bg-muted/40">
                    <OrganizationYears orgGUID={org.strOrgGUID} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </ModalDialog>
  );
}
