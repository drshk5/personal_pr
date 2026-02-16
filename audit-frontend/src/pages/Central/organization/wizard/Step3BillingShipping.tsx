import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { MapPin, Building2, Copy, HelpCircle } from "lucide-react";

import type { OrganizationFormValues } from "@/validations/central/organization";

import { useCitiesByCountryAndState } from "@/hooks/api/central/use-cities";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface Step3BillingShippingProps {
  form: UseFormReturn<OrganizationFormValues>;
  isSaving: boolean;
  countries: Array<{ strCountryGUID: string; strName: string }>;
  states: Array<{ strStateGUID: string; strName: string }>;
  cities?: Array<{ strCityGUID: string; strName: string }>;
  loadingCountries: boolean;
  loadingStates: boolean;
  loadingCities?: boolean;
  selectedCountryId_billing?: string;
  selectedCountryId_shipping?: string;
  selectedStateId_taxConfig?: string;
  onCountryChange_billing: (countryId: string) => void;
  onCountryChange_shipping: (countryId: string) => void;
}

export const Step3BillingShipping: React.FC<Step3BillingShippingProps> = ({
  form,
  isSaving,
  countries,
  states,
  loadingCountries,
  loadingStates,
  selectedCountryId_billing,
  selectedCountryId_shipping,
  selectedStateId_taxConfig,
  onCountryChange_billing,
  onCountryChange_shipping,
}) => {
  const mainCountryGUID = form.watch("strCountryGUID");
  const mainStateGUID = form.watch("strStateGUID");
  const billingCountryGUID = form.watch("strCountryGUID_billing") || undefined;
  const billingStateGUID = form.watch("strStateGUID_billing") || undefined;
  const shippingCountryGUID =
    form.watch("strCountryGUID_shipping") || undefined;
  const shippingStateGUID = form.watch("strStateGUID_shipping") || undefined;

  // Fetch cities for billing address
  const { data: billingCities = [], isLoading: billingCitiesLoading } =
    useCitiesByCountryAndState(billingCountryGUID, billingStateGUID);

  // Fetch cities for shipping address
  const { data: shippingCities = [], isLoading: shippingCitiesLoading } =
    useCitiesByCountryAndState(shippingCountryGUID, shippingStateGUID);

  // Auto-fill billing country and state on mount or when main values change
  React.useEffect(() => {
    if (mainCountryGUID) {
      const currentBillingCountry = form.getValues("strCountryGUID_billing");
      if (!currentBillingCountry) {
        form.setValue("strCountryGUID_billing", mainCountryGUID);
        onCountryChange_billing(mainCountryGUID);
      }
    }
    if (mainStateGUID) {
      const currentBillingState = form.getValues("strStateGUID_billing");
      if (!currentBillingState) {
        form.setValue("strStateGUID_billing", mainStateGUID);
      }
    }
  }, [mainCountryGUID, mainStateGUID, form, onCountryChange_billing]);

  // Auto-fill shipping country and state on mount or when main values change
  React.useEffect(() => {
    if (mainCountryGUID) {
      const currentShippingCountry = form.getValues("strCountryGUID_shipping");
      if (!currentShippingCountry) {
        form.setValue("strCountryGUID_shipping", mainCountryGUID);
        onCountryChange_shipping(mainCountryGUID);
      }
    }
    if (mainStateGUID) {
      const currentShippingState = form.getValues("strStateGUID_shipping");
      if (!currentShippingState) {
        form.setValue("strStateGUID_shipping", mainStateGUID);
      }
    }
  }, [mainCountryGUID, mainStateGUID, form, onCountryChange_shipping]);

  const countryOptions = React.useMemo(
    () =>
      countries.map((country) => ({
        value: country.strCountryGUID,
        label: country.strName,
      })),
    [countries]
  );

  const stateOptions = React.useMemo(
    () =>
      states.map((state) => ({
        value: state.strStateGUID,
        label: state.strName,
      })),
    [states]
  );

  const billingCityOptions = React.useMemo(
    () =>
      billingCities.map((city) => ({
        value: city.strCityGUID,
        label: city.strName,
      })),
    [billingCities]
  );

  const shippingCityOptions = React.useMemo(
    () =>
      shippingCities.map((city) => ({
        value: city.strCityGUID,
        label: city.strName,
      })),
    [shippingCities]
  );

  const handleCopyBillingToShipping = () => {
    const billingData = {
      strAttention_shipping: form.getValues("strAttention_billing"),
      strCountryGUID_shipping: form.getValues("strCountryGUID_billing"),
      strStateGUID_shipping: form.getValues("strStateGUID_billing"),
      strCityGUID_shipping: form.getValues("strCityGUID_billing"),
      strAddress_shipping: form.getValues("strAddress_billing"),
      strPinCode_shipping: form.getValues("strPinCode_billing"),
      strPhone_shipping: form.getValues("strPhone_billing"),
      strFaxNumber_shipping: form.getValues("strFaxNumber_billing"),
    };
    Object.entries(billingData).forEach(([key, value]) => {
      form.setValue(key as keyof OrganizationFormValues, value);
    });
    if (form.getValues("strCountryGUID_shipping")) {
      onCountryChange_shipping(form.getValues("strCountryGUID_shipping") || "");
    }
  };

  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-hidden bg-card">
      <CardContent className="p-6 sm:p-8 pb-4 sm:pb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Billing & Shipping Address
          </h2>
          <p className="text-muted-foreground">
            Add billing and shipping address information for your organization
          </p>
        </div>

        {/* Billing and Shipping Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Billing Address Section */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Billing Address</h3>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="strAttention_billing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Attention</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter attention name"
                        maxLength={150}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strCountryGUID_billing"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <FormLabel className="font-medium">Country</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          This country is set from the country you selected in
                          step 1
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <PreloadedSelect
                        disabled={true}
                        selectedValue={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                          onCountryChange_billing(value);
                        }}
                        placeholder="Select Country"
                        isLoading={loadingCountries}
                        clearable
                        options={countryOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strStateGUID_billing"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <FormLabel className="font-medium">State</FormLabel>
                      {selectedStateId_taxConfig && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            This state is set from the state you selected in tax
                            configuration step
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <FormControl>
                      <PreloadedSelect
                        disabled={
                          isSaving ||
                          loadingStates ||
                          !selectedCountryId_billing ||
                          !!selectedStateId_taxConfig // Disable if state is selected in tax config
                        }
                        selectedValue={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Select State"
                        isLoading={loadingStates}
                        clearable
                        options={stateOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strCityGUID_billing"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">City</FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        disabled={
                          isSaving ||
                          billingCitiesLoading ||
                          !selectedCountryId_billing
                        }
                        selectedValue={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Select City"
                        isLoading={billingCitiesLoading}
                        clearable
                        options={billingCityOptions}
                        initialMessage="No cities available"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strAddress_billing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter address"
                        maxLength={500}
                        className="min-h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strPinCode_billing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">PIN Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          disabled={isSaving}
                          placeholder="Enter PIN code"
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strPhone_billing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          disabled={isSaving}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="strFaxNumber_billing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Fax Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter fax number"
                        maxLength={30}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Shipping Address</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyBillingToShipping}
                disabled={isSaving}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy billing address
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4">
              <FormField
                control={form.control}
                name="strAttention_shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Attention</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter attention name"
                        maxLength={150}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strCountryGUID_shipping"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">Country</FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        disabled={isSaving || loadingCountries}
                        selectedValue={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value);
                          onCountryChange_shipping(value);
                        }}
                        placeholder="Select Country"
                        isLoading={loadingCountries}
                        clearable
                        options={countryOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strStateGUID_shipping"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">State</FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        disabled={
                          isSaving ||
                          loadingStates ||
                          !selectedCountryId_shipping
                        }
                        selectedValue={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Select State"
                        isLoading={loadingStates}
                        clearable
                        options={stateOptions}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strCityGUID_shipping"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="font-medium">City</FormLabel>
                    <FormControl>
                      <PreloadedSelect
                        disabled={
                          isSaving ||
                          shippingCitiesLoading ||
                          !selectedCountryId_shipping
                        }
                        selectedValue={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        placeholder="Select City"
                        isLoading={shippingCitiesLoading}
                        clearable
                        options={shippingCityOptions}
                        initialMessage="No cities available"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strAddress_shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter address"
                        maxLength={500}
                        className="min-h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="strPinCode_shipping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">PIN Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          disabled={isSaving}
                          placeholder="Enter PIN code"
                          maxLength={20}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strPhone_shipping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Phone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value || ""}
                          onChange={field.onChange}
                          disabled={isSaving}
                          placeholder="Enter phone number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="strFaxNumber_shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Fax Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled={isSaving}
                        placeholder="Enter fax number"
                        maxLength={30}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
