import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Building, X, Camera, HelpCircle } from "lucide-react";

import type { OrganizationFormValues } from "@/validations/central/organization";

import { getImagePath } from "@/lib/utils";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface Step1MainDetailsProps {
  form: UseFormReturn<OrganizationFormValues>;
  isSaving: boolean;
  loadingCountries: boolean;
  loadingIndustries: boolean;
  loadingLegalStatus: boolean;
  loadingCurrencyTypes: boolean;
  countries: Array<{ strCountryGUID: string; strName: string }>;
  industries: Array<{ strIndustryGUID: string; strName: string }>;
  legalStatusTypes: Array<{ strLegalStatusTypeGUID: string; strName: string }>;
  currencyTypes: Array<{ strCurrencyTypeGUID: string; strName: string }>;
  isEditMode: boolean;
  previewUrl?: string;
  logoFile?: File;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Step1MainDetails: React.FC<Step1MainDetailsProps> = ({
  form,
  isSaving,
  loadingCountries,
  loadingIndustries,
  loadingLegalStatus,
  loadingCurrencyTypes,
  countries,
  industries,
  legalStatusTypes,
  currencyTypes,
  isEditMode,
  previewUrl,
  logoFile,
  onFileChange,
  onRemoveFile,
  fileInputRef,
}) => {
  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-visible bg-card">
      <CardContent className="p-6 sm:p-8 pb-0 sm:pb-6 overflow-visible">
        {/* Logo Upload Section */}
        <div className="flex justify-center w-full mb-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <FormLabel className="mb-0">Organization Logo</FormLabel>
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted-foreground/20 cursor-help transition-colors"
                title="Upload an organization logo (optional). Max file size: 2MB. Supported formats: JPEG, PNG"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </span>
            </div>

            <FormField
              control={form.control}
              name="strLogo"
              render={({ field }) => (
                <input
                  type="hidden"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            />

            <div className="flex flex-col items-center ">
              <div className="relative">
                {previewUrl && (
                  <button
                    type="button"
                    className="absolute -right-2 -top-2 z-30 rounded-full p-1 bg-muted text-foreground shadow-md hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveFile();
                    }}
                    disabled={isSaving}
                    aria-label="Remove logo"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </button>
                )}
                <div
                  className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 cursor-pointer group"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  {previewUrl ? (
                    <LazyImage
                      src={
                        logoFile
                          ? URL.createObjectURL(logoFile)
                          : getImagePath(previewUrl) || ""
                      }
                      alt="Organization logo"
                      className="w-full h-full object-cover object-center"
                      containerClassName="w-full h-full rounded-full"
                      placeholderClassName="rounded-full"
                      loading={logoFile ? "eager" : "lazy"}
                      threshold={100}
                      rootMargin="50px"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/5 flex items-center justify-center">
                      <Building className="h-16 w-16 text-muted-foreground/90" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={onFileChange}
              className="hidden"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Main Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">
          <FormField
            control={form.control}
            name="strOrganizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Organization Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter organization name"
                    className="px-3 py-2 shadow-sm hover:border-muted-foreground/50 transition-colors"
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strUDFCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Organization Code <span className="text-red-500">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help ml-2" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Provide a concise, user-defined code that uniquely
                      identifies this organization.
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter Organization Code"
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="strCountryGUID"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Country <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      disabled={isEditMode || isSaving || loadingCountries}
                      selectedValue={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select Country"
                      isLoading={loadingCountries}
                      options={(countries || []).map((country) => ({
                        value: country.strCountryGUID,
                        label: country.strName || "Unnamed Country",
                      }))}
                      initialMessage="No countries available"
                      queryKey={["countries", "active"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">
          <FormField
            control={form.control}
            name="strIndustryGUID"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Industry <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      disabled={isSaving || loadingIndustries}
                      selectedValue={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select Industry"
                      isLoading={loadingIndustries}
                      options={(industries || []).map((industry) => ({
                        value: industry.strIndustryGUID,
                        label: industry.strName || "Unnamed Industry",
                      }))}
                      initialMessage="No industries available"
                      queryKey={["industries", "active"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="strLegalStatusTypeGUID"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Legal Status Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      disabled={isSaving || loadingLegalStatus}
                      onChange={field.onChange}
                      selectedValue={field.value || ""}
                      placeholder="Select Legal Status Type"
                      isLoading={loadingLegalStatus}
                      options={(legalStatusTypes || []).map((status) => ({
                        value: status.strLegalStatusTypeGUID,
                        label: status.strName || "Unnamed Legal Status Type",
                      }))}
                      initialMessage="No legal status types available"
                      queryKey={["legalStatusTypes", "active"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="strCurrencyTypeGUID"
            render={({ field }) => {
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Currency <span className="text-red-500">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help ml-2" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Select the primary currency that will be used for
                        calculations and reporting across all transaction pages
                        in this module.
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <PreloadedSelect
                      disabled={isEditMode || isSaving || loadingCurrencyTypes}
                      selectedValue={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Select Currency"
                      isLoading={loadingCurrencyTypes}
                      options={(currencyTypes || []).map((currency) => ({
                        value: currency.strCurrencyTypeGUID,
                        label: currency.strName,
                      }))}
                      initialMessage="No currencies available"
                      queryKey={["currencyTypes", "active"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 mb-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="strDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter description"
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField
            control={form.control}
            name="bolIsActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 rounded-lg p-4 border border-border-color/50">
                <div className="flex-1">
                  <FormLabel className="text-base mb-0">
                    Active Status
                  </FormLabel>
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
            name="bolIsTaxApplied"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 rounded-lg p-4 border border-border-color/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FormLabel className="text-base mb-0">
                      Tax Applied
                    </FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Enable to indicate that tax is applicable for this
                        organization. This setting determines whether tax
                        calculations will be applied to transactions for this
                        organization.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={isSaving}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
