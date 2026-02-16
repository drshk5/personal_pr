import React, { useMemo, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Info } from "lucide-react";

import type { OrganizationFormValues } from "@/validations/central/organization";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

import { TaxConfigurationSection } from "../TaxConfigurationSection";

interface Step3TaxConfigurationProps {
  form: UseFormReturn<OrganizationFormValues>;
  isSaving: boolean;
  selectedCountryId?: string;
  selectedTaxType: string | null;
  states: Array<{ strStateGUID: string; strName: string }>;
  loadingStates: boolean;
  taxTypeData: unknown;
  onStateChange?: (stateId: string | undefined) => void;
}

export const Step3TaxConfiguration: React.FC<Step3TaxConfigurationProps> = ({
  form,
  isSaving,
  selectedCountryId,
  selectedTaxType,
  states,
  loadingStates,
  taxTypeData,
  onStateChange,
}) => {
  const isTaxConfigRequired = form.watch("bolIsTaxApplied") ?? false;

  const taxType = useMemo(() => {
    if (!taxTypeData || Array.isArray(taxTypeData)) return null;
    return taxTypeData as {
      strTaxTypeGUID?: string;
      strTaxTypeName?: string;
      strTaxTypeCode?: string;
    };
  }, [taxTypeData]);

  const availableTaxTypes = useMemo(() => {
    if (!taxType) return [];

    return [
      {
        value: taxType.strTaxTypeGUID,
        label: taxType.strTaxTypeName,
        code: taxType.strTaxTypeCode,
      },
    ];
  }, [taxType]);

  const selectedTaxTypeCode = useMemo(() => {
    if (!selectedTaxType || !taxType) return null;
    if (taxType.strTaxTypeGUID === selectedTaxType) {
      const upperCode = taxType.strTaxTypeCode?.toUpperCase();
      if (!upperCode) return null;
      if (upperCode.startsWith("GST")) return "GST";
      if (upperCode.startsWith("VAT")) return "VAT";
      if (upperCode.startsWith("SALES_TAX")) return "SALES_TAX";
      return upperCode;
    }
    return null;
  }, [selectedTaxType, taxType]);

  // Watch strStateGUID and notify parent component
  const selectedStateGUID = form.watch("strStateGUID");
  useEffect(() => {
    if (onStateChange) {
      onStateChange(selectedStateGUID || undefined);
    }
  }, [selectedStateGUID, onStateChange]);

  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-hidden bg-card">
      <CardContent className="p-6 sm:p-8 pb-4 sm:pb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Tax Configuration
          </h2>
          <p className="text-muted-foreground">
            Set up tax information based on your country
          </p>
        </div>

        {!selectedCountryId && (
          <div className="mb-6 p-4 rounded-lg border border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-orange-600 mt-1 shrink-0" />
              <div className="text-orange-800 text-sm">
                Please select a country in the previous step to configure tax
                settings.
              </div>
            </div>
          </div>
        )}

        {selectedCountryId && availableTaxTypes.length === 0 && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-yellow-600 mt-1 shrink-0" />
              <div className="text-yellow-800 text-sm">
                No tax types configured for the selected country.
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
          {/* Tax Type Input (Disabled) */}
          <FormField
            control={form.control}
            name="strTaxTypeGUID"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Tax Type</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={
                      selectedTaxType
                        ? availableTaxTypes.find(
                            (t) => t.value === selectedTaxType
                          )?.label || selectedTaxType
                        : ""
                    }
                    placeholder={
                      availableTaxTypes.length === 0
                        ? "Select country first"
                        : "Tax type based on country"
                    }
                    disabled={true}
                    className="bg-muted"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedTaxTypeCode && (
            <FormField
              control={form.control}
              name="strTaxRegNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    {selectedTaxTypeCode === "GST" && "GST Registration Number"}
                    {selectedTaxTypeCode === "VAT" && "VAT Registration Number"}
                    {selectedTaxTypeCode === "SALES_TAX" &&
                      "Sales Tax License Number"}
                    {isTaxConfigRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        selectedTaxTypeCode === "GST"
                          ? "Enter GST number"
                          : selectedTaxTypeCode === "VAT"
                            ? "Enter VAT number"
                            : "Enter sales tax license number"
                      }
                      {...field}
                      value={field.value || ""}
                      disabled={isSaving}
                      maxLength={50}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="strStateGUID"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-medium">
                    State
                    {isTaxConfigRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      disabled={isSaving || loadingStates || !selectedCountryId}
                      selectedValue={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select State"
                      isLoading={loadingStates}
                      options={(states || []).map((state) => ({
                        value: state.strStateGUID,
                        label: state.strName || "Unnamed State",
                      }))}
                      initialMessage="No states available"
                      queryKey={[
                        "states",
                        "byCountry",
                        selectedCountryId || "",
                      ]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 mb-6">
          <FormField
            control={form.control}
            name="dtRegistrationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="font-medium">Registration Date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={
                      field.value instanceof Date ? field.value : undefined
                    }
                    onChange={(date) => field.onChange(date)}
                    disabled={isSaving}
                    placeholder="Select registration date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedTaxTypeCode === "GST" && (
            <>
              <FormField
                control={form.control}
                name="strPAN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">PAN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter PAN"
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strTAN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">TAN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter TAN"
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strCIN"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">CIN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="Enter CIN"
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        {/* Country-Specific Tax Configuration */}
        {selectedTaxTypeCode && (
          <div className="mt-6 border-t border-border-color pt-6">
            <h3 className="text-lg font-semibold mb-2">
              Advanced Tax Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <TaxConfigurationSection
                form={form}
                isSaving={isSaving}
                taxType={selectedTaxTypeCode}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
