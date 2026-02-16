import React, { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";

import type { OrganizationFormValues } from "@/validations/central/organization";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCitiesByCountryAndState } from "@/hooks/api/central/use-cities";

interface Step5ReviewSummaryProps {
  form: UseFormReturn<OrganizationFormValues>;
  countries: Array<{ strCountryGUID: string; strName: string }>;
  states: Array<{ strStateGUID: string; strName: string }>;
  industries: Array<{ strIndustryGUID: string; strName: string }>;
  legalStatusTypes: Array<{ strLegalStatusTypeGUID: string; strName: string }>;
  currencyTypes: Array<{ strCurrencyTypeGUID: string; strName: string }>;
  parentOrganizations: Array<{
    strOrganizationGUID: string;
    strOrganizationName: string;
  }>;
  taxTypeData: unknown;
  selectedTaxType: string | null;
  isTaxConfigRequired: boolean;
  previewUrl?: string;
}

interface SummaryItemProps {
  label: string;
  value?: React.ReactNode;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value }) => {
  return (
    <div className="space-y-1 min-w-0">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground wrap-break-word">
        {value ?? "—"}
      </div>
    </div>
  );
};

const formatDate = (value?: Date | string | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

export const Step5ReviewSummary: React.FC<Step5ReviewSummaryProps> = ({
  form,
  countries,
  states,
  industries,
  legalStatusTypes,
  currencyTypes,
  parentOrganizations,
  taxTypeData,
  selectedTaxType,
  isTaxConfigRequired,
  previewUrl,
}) => {
  const values = form.watch();

  const billingCountryId = values.strCountryGUID_billing || undefined;
  const billingStateId = values.strStateGUID_billing || undefined;
  const shippingCountryId = values.strCountryGUID_shipping || undefined;
  const shippingStateId = values.strStateGUID_shipping || undefined;

  const { data: billingCities = [] } = useCitiesByCountryAndState(
    billingCountryId,
    billingStateId
  );
  const { data: shippingCities = [] } = useCitiesByCountryAndState(
    shippingCountryId,
    shippingStateId
  );

  const countryMap = useMemo(() => {
    const map = new Map<string, string>();
    countries.forEach((c) => map.set(c.strCountryGUID, c.strName));
    return map;
  }, [countries]);

  const stateMap = useMemo(() => {
    const map = new Map<string, string>();
    states.forEach((s) => map.set(s.strStateGUID, s.strName));
    return map;
  }, [states]);

  const industryMap = useMemo(() => {
    const map = new Map<string, string>();
    industries.forEach((i) => map.set(i.strIndustryGUID, i.strName));
    return map;
  }, [industries]);

  const legalStatusMap = useMemo(() => {
    const map = new Map<string, string>();
    legalStatusTypes.forEach((l) =>
      map.set(l.strLegalStatusTypeGUID, l.strName)
    );
    return map;
  }, [legalStatusTypes]);

  const currencyMap = useMemo(() => {
    const map = new Map<string, string>();
    currencyTypes.forEach((c) => map.set(c.strCurrencyTypeGUID, c.strName));
    return map;
  }, [currencyTypes]);

  const parentOrgMap = useMemo(() => {
    const map = new Map<string, string>();
    parentOrganizations.forEach((p) =>
      map.set(p.strOrganizationGUID, p.strOrganizationName)
    );
    return map;
  }, [parentOrganizations]);

  const taxType = useMemo(() => {
    if (!taxTypeData || Array.isArray(taxTypeData)) return null;
    return taxTypeData as {
      strTaxTypeGUID?: string;
      strTaxTypeName?: string;
    };
  }, [taxTypeData]);

  const taxTypeName = useMemo(() => {
    if (!taxType) return "—";
    if (selectedTaxType && taxType.strTaxTypeGUID === selectedTaxType) {
      return taxType.strTaxTypeName || "—";
    }
    return taxType.strTaxTypeName || "—";
  }, [selectedTaxType, taxType]);

  const billingCityName = useMemo(() => {
    return (
      billingCities.find(
        (city) => city.strCityGUID === values.strCityGUID_billing
      )?.strName || "—"
    );
  }, [billingCities, values.strCityGUID_billing]);

  const shippingCityName = useMemo(() => {
    return (
      shippingCities.find(
        (city) => city.strCityGUID === values.strCityGUID_shipping
      )?.strName || "—"
    );
  }, [shippingCities, values.strCityGUID_shipping]);

  return (
    <Card className="border-border-color shadow-md rounded-t-xl rounded-b-none overflow-hidden bg-card">
      <CardContent className="p-6 sm:p-8 pb-4 sm:pb-6">
        <div className="mb-8 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Review & Confirm
            </h2>
            <p className="text-muted-foreground">
              Verify the information below before submitting. Use Previous to
              edit anything.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Main Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryItem
                  label="Organization Name"
                  value={values.strOrganizationName || "—"}
                />
                <SummaryItem
                  label="Organization Code"
                  value={values.strUDFCode || "—"}
                />
                <SummaryItem
                  label="Active"
                  value={values.bolIsActive ? "Yes" : "No"}
                />
                <SummaryItem
                  label="Country"
                  value={countryMap.get(values.strCountryGUID || "") || "—"}
                />
                <SummaryItem
                  label="Industry"
                  value={industryMap.get(values.strIndustryGUID || "") || "—"}
                />
                <SummaryItem
                  label="Legal Status"
                  value={
                    legalStatusMap.get(values.strLegalStatusTypeGUID || "") ||
                    "—"
                  }
                />
                <SummaryItem
                  label="Currency"
                  value={
                    currencyMap.get(values.strCurrencyTypeGUID || "") || "—"
                  }
                />
                <SummaryItem
                  label="Description"
                  value={values.strDescription || "—"}
                />
              </div>
            </div>

            {previewUrl && (
              <div className="flex flex-col items-center justify-start gap-3 p-4 rounded-lg border border-border-color bg-muted/40">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Logo Preview
                </div>
                <img
                  src={previewUrl}
                  alt="Organization logo preview"
                  className="w-32 h-32 rounded-full object-cover border"
                />
              </div>
            )}
          </div>

          {!values.strYearName &&
          !values.dtStartDate &&
          !values.dtEndDate ? null : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Year Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryItem
                  label="Year Name"
                  value={values.strYearName || "—"}
                />
                <SummaryItem
                  label="Start Date"
                  value={formatDate(values.dtStartDate)}
                />
                <SummaryItem
                  label="End Date"
                  value={formatDate(values.dtEndDate)}
                />
              </div>
            </div>
          )}

          {isTaxConfigRequired && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tax Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryItem label="Tax Type" value={taxTypeName} />
                <SummaryItem
                  label="Registration Number"
                  value={values.strTaxRegNo || "—"}
                />
                <SummaryItem
                  label="State"
                  value={stateMap.get(values.strStateGUID || "") || "—"}
                />
                <SummaryItem
                  label="Registration Date"
                  value={formatDate(values.dtRegistrationDate)}
                />
                <SummaryItem label="PAN" value={values.strPAN || "—"} />
                <SummaryItem label="TAN" value={values.strTAN || "—"} />
                <SummaryItem label="CIN" value={values.strCIN || "—"} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-lg border border-border-color bg-muted/40">
                <div className="text-sm font-semibold">Billing Address</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SummaryItem
                    label="Attention"
                    value={values.strAttention_billing || "—"}
                  />
                  <SummaryItem
                    label="Phone"
                    value={values.strPhone_billing || "—"}
                  />
                  <SummaryItem
                    label="Country"
                    value={
                      countryMap.get(values.strCountryGUID_billing || "") || "—"
                    }
                  />
                  <SummaryItem
                    label="State"
                    value={
                      stateMap.get(values.strStateGUID_billing || "") || "—"
                    }
                  />
                  <SummaryItem label="City" value={billingCityName} />
                  <SummaryItem
                    label="PIN Code"
                    value={values.strPinCode_billing || "—"}
                  />
                  <SummaryItem
                    label="Fax"
                    value={values.strFaxNumber_billing || "—"}
                  />
                  <SummaryItem
                    label="Address"
                    value={values.strAddress_billing || "—"}
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg border border-border-color bg-muted/40">
                <div className="text-sm font-semibold">Shipping Address</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SummaryItem
                    label="Attention"
                    value={values.strAttention_shipping || "—"}
                  />
                  <SummaryItem
                    label="Phone"
                    value={values.strPhone_shipping || "—"}
                  />
                  <SummaryItem
                    label="Country"
                    value={
                      countryMap.get(values.strCountryGUID_shipping || "") ||
                      "—"
                    }
                  />
                  <SummaryItem
                    label="State"
                    value={
                      stateMap.get(values.strStateGUID_shipping || "") || "—"
                    }
                  />
                  <SummaryItem label="City" value={shippingCityName} />
                  <SummaryItem
                    label="PIN Code"
                    value={values.strPinCode_shipping || "—"}
                  />
                  <SummaryItem
                    label="Fax"
                    value={values.strFaxNumber_shipping || "—"}
                  />
                  <SummaryItem
                    label="Address"
                    value={values.strAddress_shipping || "—"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryItem
                label="Parent Organization"
                value={
                  values.strParentOrganizationGUID
                    ? parentOrgMap.get(values.strParentOrganizationGUID) || "—"
                    : "No Parent"
                }
              />
              <SummaryItem
                label="Client Acquired Date"
                value={formatDate(values.dtClientAcquiredDate)}
              />
              <SummaryItem
                label="Tax Applied"
                value={values.bolIsTaxApplied ? "Yes" : "No"}
              />
            </div>
          </div>
        </div>

        <Separator className="mt-8" />
        <div className="mt-4 text-sm text-muted-foreground">
          Please ensure the above details are correct before proceeding. You can
          go back to edit any section.
        </div>
      </CardContent>
    </Card>
  );
};
