import React from "react";
import type { UseFormReturn } from "react-hook-form";

import type { OrganizationFormValues } from "@/validations/central/organization";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

interface Step4OtherInformationProps {
  form: UseFormReturn<OrganizationFormValues>;
  isSaving: boolean;
  isEditMode: boolean;
  organizationId?: string;
  isOrganizationSaved: boolean;
  parentOrganizations: Array<{
    strOrganizationGUID: string;
    strOrganizationName: string;
  }>;
  loadingOrganizations: boolean;
}

export const Step4OtherInformation: React.FC<Step4OtherInformationProps> = ({
  form,
  isSaving,
  organizationId,
  parentOrganizations,
  loadingOrganizations,
}) => {
  const organizationOptions = React.useMemo(() => {
    return parentOrganizations.map((org) => ({
      value: org.strOrganizationGUID,
      label: org.strOrganizationName,
    }));
  }, [parentOrganizations]);

  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-visible bg-card">
      <CardContent className="p-6 sm:p-8 pb-4 sm:pb-6 overflow-visible">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Additional Information
          </h2>
          <p className="text-muted-foreground">
            Complete your organization setup with additional details and
            addresses
          </p>
        </div>

        {/* Organization Hierarchy */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Organization Hierarchy</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField
              control={form.control}
              name="strParentOrganizationGUID"
              render={({ field }) => {
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">
                      Parent Organization
                    </FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        disabled={isSaving || loadingOrganizations}
                        selectedValue={field.value || "none"}
                        onChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                        placeholder="Select Parent Organization"
                        isLoading={loadingOrganizations}
                        clearable={field.value !== "none" && field.value !== ""}
                        options={[
                          {
                            value: "none",
                            label: "No Parent Organization",
                          },
                          ...(organizationOptions || []),
                        ]}
                        initialMessage={
                          loadingOrganizations
                            ? "Loading organizations..."
                            : "No organizations available"
                        }
                        queryKey={[
                          "parentOrganizations",
                          organizationId ||
                            "00000000-0000-0000-0000-000000000000",
                          "",
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="dtClientAcquiredDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-medium">
                    Client Acquired Date
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={
                        field.value instanceof Date ? field.value : undefined
                      }
                      onChange={(date) => field.onChange(date)}
                      disabled={isSaving}
                      placeholder="Select date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
