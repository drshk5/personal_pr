import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TaxConfigurationSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  isSaving: boolean;
  taxType: string | null;
}

export const TaxConfigurationSection: React.FC<
  TaxConfigurationSectionProps
> = ({ form, isSaving, taxType }) => {
  // Determine the base tax type from the code
  const baseTaxType = React.useMemo(() => {
    if (!taxType) return null;
    const upperTaxType = taxType.toUpperCase();
    if (upperTaxType.startsWith("GST")) return "GST";
    if (upperTaxType.startsWith("VAT")) return "VAT";
    if (upperTaxType.startsWith("SALES_TAX")) return "SALES_TAX";
    return null;
  }, [taxType]);

  return (
    <>
      {/* GST Specific Fields */}
      {baseTaxType === "GST" && (
        <>
          <div className="col-span-full">
            <Separator className="my-4" />
          </div>

          <FormField
            control={form.control}
            name="eInvoiceEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Enable E-Invoice</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Electronic invoicing system
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="compositionScheme"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Composition/Simplified Scheme</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    For small businesses with simplified compliance
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gstinVerificationRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Verify Customer Tax Registration</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Validate customer GST/Tax registration numbers
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="printHSNCode"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Print HSN/SAC Code on Invoice</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Harmonized System of Nomenclature code
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}

      {/* VAT Specific Fields */}
      {baseTaxType === "VAT" && (
        <>
          <div className="col-span-full">
            <Separator className="my-4" />
            <h4 className="text-sm font-medium mb-4">VAT Configuration</h4>
          </div>

          <FormField
            control={form.control}
            name="vatScheme"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>VAT Scheme</FormLabel>
                <FormControl>
                  <PreloadedSelect
                    disabled={isSaving}
                    selectedValue={field.value || "Standard"}
                    onChange={field.onChange}
                    placeholder="Select VAT Scheme"
                    options={[
                      { value: "Standard", label: "Standard" },
                      { value: "FlatRate", label: "Flat Rate" },
                      { value: "CashAccounting", label: "Cash Accounting" },
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountingBasis"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Accounting Basis</FormLabel>
                <FormControl>
                  <PreloadedSelect
                    disabled={isSaving}
                    selectedValue={field.value || "Accrual"}
                    onChange={field.onChange}
                    placeholder="Select Accounting Basis"
                    options={[
                      { value: "Accrual", label: "Accrual" },
                      { value: "Cash", label: "Cash" },
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("vatScheme") === "FlatRate" && (
            <FormField
              control={form.control}
              name="flatRatePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat Rate %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Enter flat rate (e.g., 12.0)"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="mtdEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Making Tax Digital (MTD) Enabled</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}

      {/* USA Sales Tax Specific Fields */}
      {baseTaxType === "SALES_TAX" && (
        <>
          <div className="col-span-full">
            <Separator className="my-4" />
            <h4 className="text-sm font-medium mb-4">USA Sales Tax Setup</h4>
          </div>

          <FormField
            control={form.control}
            name="primaryState"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Primary State</FormLabel>
                <FormControl>
                  <PreloadedSelect
                    disabled={isSaving}
                    selectedValue={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Select Primary State"
                    options={[
                      { value: "CA", label: "California" },
                      { value: "NY", label: "New York" },
                      { value: "TX", label: "Texas" },
                      { value: "FL", label: "Florida" },
                      { value: "IL", label: "Illinois" },
                      { value: "PA", label: "Pennsylvania" },
                      { value: "OH", label: "Ohio" },
                    ]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-full">
            <FormItem>
              <FormLabel>States with Nexus</FormLabel>
              <div className="grid grid-cols-4 gap-4 mt-2">
                {[
                  { code: "CA", name: "California" },
                  { code: "NY", name: "New York" },
                  { code: "TX", name: "Texas" },
                  { code: "FL", name: "Florida" },
                  { code: "IL", name: "Illinois" },
                  { code: "PA", name: "Pennsylvania" },
                  { code: "OH", name: "Ohio" },
                  { code: "WA", name: "Washington" },
                ].map((state) => (
                  <div key={state.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`nexus-${state.code}`}
                      checked={
                        form.watch("nexusStates")?.includes(state.code) || false
                      }
                      onCheckedChange={(checked) => {
                        const current = form.watch("nexusStates") || [];
                        if (checked) {
                          form.setValue("nexusStates", [
                            ...current,
                            state.code,
                          ]);
                        } else {
                          form.setValue(
                            "nexusStates",
                            current.filter((s: string) => s !== state.code)
                          );
                        }
                      }}
                      disabled={isSaving}
                    />
                    <label
                      htmlFor={`nexus-${state.code}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {state.code} - {state.name}
                    </label>
                  </div>
                ))}
              </div>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="economicNexusEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Economic Nexus Enabled</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marketplaceFacilitator"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Marketplace Facilitator</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showTaxBreakdownOnInvoice"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-4">
                <div className="space-y-0.5">
                  <FormLabel>Show Tax Breakdown on Invoice</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
};
