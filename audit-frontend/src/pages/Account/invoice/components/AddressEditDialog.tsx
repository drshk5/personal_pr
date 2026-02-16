import React from "react";

import type { InvoiceAddress } from "@/types/Account/salesinvoice";
import type { Country } from "@/types/central/country";
import type { State } from "@/types/central/state";
import type { City } from "@/types/central/city";

import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useStatesByCountry } from "@/hooks/api/central/use-states";
import { useCitiesByCountryAndState } from "@/hooks/api/central/use-cities";
import { useUpdateBillingAndShippingAddress } from "@/hooks/api/Account/use-parties";

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";

interface AddressEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialAddress?: InvoiceAddress | null;
  disabled?: boolean;
  onSave: (address: InvoiceAddress | null) => void;
  partyGUID?: string;
  addressType?: "billing" | "shipping";
}

export const AddressEditDialog: React.FC<AddressEditDialogProps> = ({
  open,
  onOpenChange,
  title,
  initialAddress,
  disabled,
  onSave,
  partyGUID,
  addressType,
}) => {
  const updateAddressMutation = useUpdateBillingAndShippingAddress();
  const [address, setAddress] = React.useState<InvoiceAddress | null>(
    initialAddress ?? {
      strAttention: null,
      strCountryGUID: null,
      strCountryName: null,
      strAddress: null,
      strStateGUID: null,
      strStateName: null,
      strCityGUID: null,
      strCityName: null,
      strPinCode: null,
      strPhone: null,
      strFaxNumber: null,
    }
  );
  const [dropdownOpen, setDropdownOpen] = React.useState({
    country: false,
    state: false,
    city: false,
  });

  const countriesEnabled = dropdownOpen.country || open;
  const statesEnabled = dropdownOpen.state || open;
  const citiesEnabled = dropdownOpen.city || open;

  React.useEffect(() => {
    setAddress(
      initialAddress ?? {
        strAttention: null,
        strCountryGUID: null,
        strCountryName: null,
        strAddress: null,
        strStateGUID: null,
        strStateName: null,
        strCityGUID: null,
        strCityName: null,
        strPinCode: null,
        strPhone: null,
        strFaxNumber: null,
      }
    );
  }, [initialAddress]);

  const selectedCountryGUID = address?.strCountryGUID || "";
  const selectedStateGUID = address?.strStateGUID || "";

  const { data: countries = [], isLoading: isLoadingCountries } =
    useActiveCountries(undefined, {
      enabled: countriesEnabled,
    });
  const { data: states = [], isLoading: isLoadingStates } = useStatesByCountry(
    selectedCountryGUID || undefined,
    undefined,
    { enabled: statesEnabled && !!selectedCountryGUID }
  );
  const { data: cities = [], isLoading: isLoadingCities } =
    useCitiesByCountryAndState(
      selectedCountryGUID || undefined,
      selectedStateGUID || undefined,
      undefined,
      { enabled: citiesEnabled && !!selectedCountryGUID && !!selectedStateGUID }
    );

  const countriesData = (countries as Country[]) || [];
  const statesData = (states as State[]) || [];
  const citiesData = (cities as City[]) || [];

  const updateField =
    (key: keyof InvoiceAddress) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value ?? "";
      setAddress(
        (prev) =>
          ({
            ...(prev ?? {}),
            [key]: value.length ? value : null,
          }) as InvoiceAddress
      );
    };

  const handleCountryChange = (value?: string) => {
    const selected = countriesData.find((c) => c.strCountryGUID === value);
    setAddress((prev) => ({
      ...(prev ?? {}),
      strCountryGUID: value || null,
      strCountryName: selected?.strName || null,
      strStateGUID: null,
      strStateName: null,
      strCityGUID: null,
      strCityName: null,
    }));
  };

  const handleStateChange = (value?: string) => {
    const selected = statesData.find((s) => s.strStateGUID === value);
    setAddress((prev) => ({
      ...(prev ?? {}),
      strStateGUID: value || null,
      strStateName: selected?.strName || null,
      // reset city when state changes
      strCityGUID: null,
      strCityName: null,
    }));
  };

  const handleCityChange = (value?: string) => {
    const selected = citiesData.find((c) => c.strCityGUID === value);
    setAddress((prev) => ({
      ...(prev ?? {}),
      strCityGUID: value || null,
      strCityName: selected?.strName || null,
    }));
  };

  const handleSave = async () => {
    // Normalize: if all fields are blank, return null
    const hasValue =
      address &&
      Object.values(address).some((v) => {
        if (v === null || v === undefined) return false;
        return String(v).trim().length > 0;
      });
    const finalAddress = hasValue ? address : null;

    // Call parent onSave to update form state
    onSave(finalAddress);

    // Update in backend if partyGUID and addressType are provided
    if (partyGUID && addressType) {
      try {
        const updateData =
          addressType === "billing"
            ? {
                strAttention_billing: finalAddress?.strAttention || null,
                strCountryGUID_billing: finalAddress?.strCountryGUID || null,
                strAddress_billing: finalAddress?.strAddress || null,
                strStateGUID_billing: finalAddress?.strStateGUID || null,
                strCityGUID_billing: finalAddress?.strCityGUID || null,
                strPinCode_billing: finalAddress?.strPinCode || null,
                strPhone_billing: finalAddress?.strPhone || null,
                strFaxNumber_billing: finalAddress?.strFaxNumber || null,
              }
            : {
                strAttention_shipping: finalAddress?.strAttention || null,
                strCountryGUID_shipping: finalAddress?.strCountryGUID || null,
                strAddress_shipping: finalAddress?.strAddress || null,
                strStateGUID_shipping: finalAddress?.strStateGUID || null,
                strCityGUID_shipping: finalAddress?.strCityGUID || null,
                strPinCode_shipping: finalAddress?.strPinCode || null,
                strPhone_shipping: finalAddress?.strPhone || null,
                strFaxNumber_shipping: finalAddress?.strFaxNumber || null,
              };

        await updateAddressMutation.mutateAsync({
          partyGUID,
          data: updateData,
        });
      } catch (error) {
        // Error already handled by mutation
        console.error(`Failed to update ${addressType} address:`, error);
      }
    }

    onOpenChange(false);
  };

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth="720px"
      footerContent={
        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={disabled || updateAddressMutation.isPending}
          >
            {updateAddressMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">Attention</label>
            <Input
              value={address?.strAttention ?? ""}
              onChange={updateField("strAttention")}
              disabled={disabled}
              className="h-9"
            />
          </div>

          <div>
            <label className="text-sm">Phone</label>
            <PhoneInput
              value={address?.strPhone || ""}
              onChange={(value) =>
                setAddress((prev) => ({
                  ...(prev ?? {}),
                  strPhone: value || null,
                }))
              }
              disabled={disabled}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm">Address</label>
            <Textarea
              value={address?.strAddress ?? ""}
              onChange={updateField("strAddress")}
              rows={3}
              disabled={disabled}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-sm">City</label>
            <PreloadedSelect
              disabled={disabled || !selectedStateGUID}
              selectedValue={address?.strCityGUID || ""}
              onChange={(val) => handleCityChange(val || undefined)}
              placeholder="Select City"
              isLoading={isLoadingCities}
              options={(citiesData || []).map((city) => ({
                value: city.strCityGUID,
                label: city.strName,
              }))}
              initialMessage="No cities available"
              queryKey={["cities", selectedCountryGUID, selectedStateGUID]}
              onOpenChange={(isOpen: boolean) =>
                setDropdownOpen((p) => ({ ...p, city: isOpen }))
              }
            />
          </div>
          <div>
            <label className="text-sm">State</label>
            <PreloadedSelect
              disabled={disabled || !selectedCountryGUID}
              selectedValue={address?.strStateGUID || ""}
              onChange={(val) => handleStateChange(val || undefined)}
              placeholder="Select State"
              isLoading={isLoadingStates}
              options={(statesData || []).map((state) => ({
                value: state.strStateGUID,
                label: state.strName,
              }))}
              initialMessage="No states available"
              queryKey={["states", selectedCountryGUID]}
              onOpenChange={(isOpen: boolean) =>
                setDropdownOpen((p) => ({ ...p, state: isOpen }))
              }
            />
          </div>

          <div>
            <label className="text-sm">Pin Code</label>
            <Input
              value={address?.strPinCode ?? ""}
              onChange={updateField("strPinCode")}
              disabled={disabled}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-sm">Country</label>
            <PreloadedSelect
              disabled={disabled}
              selectedValue={address?.strCountryGUID || ""}
              onChange={(val) => handleCountryChange(val || undefined)}
              placeholder="Select Country"
              isLoading={isLoadingCountries}
              options={(countriesData || []).map((country) => ({
                value: country.strCountryGUID,
                label: country.strName || "Unnamed Country",
              }))}
              initialMessage="No countries available"
              queryKey={["countries", "active"]}
              onOpenChange={(isOpen: boolean) =>
                setDropdownOpen((p) => ({ ...p, country: isOpen }))
              }
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm">Fax</label>
            <Input
              value={address?.strFaxNumber ?? ""}
              onChange={updateField("strFaxNumber")}
              disabled={disabled}
              className="h-9"
            />
          </div>
        </div>
      </div>
    </ModalDialog>
  );
};

export default AddressEditDialog;
