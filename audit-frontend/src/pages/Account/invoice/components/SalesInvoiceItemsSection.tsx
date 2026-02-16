import React from "react";
import { InvoiceItemsTable } from "./SalesInvoiceItemsTable";
import { TaxCalculationSummary } from "./TaxCalculationSummary";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/validations/Account/salesinvoice";
import type { InvoiceItem } from "@/types/Account/salesinvoice";
import type { AttachmentFile } from "@/types/common";
import type { PartyWithLocations } from "@/types/Account/party";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<FormData>;
  invoiceItems: InvoiceItem[];
  setInvoiceItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  isFormDisabled: boolean;
  currencyLabel?: string;
  existingFiles: AttachmentFile[];
  attachments: File[];
  onExistingFileRemove: (guid: string) => void;
  onNewFileAdd: (files: File[]) => void;
  onNewFileRemove: (index: number) => void;
  // Exchange rate UI props
  isDifferentCurrency?: boolean;
  exchangeRateData?: {
    Rate: number;
    FromCurrency?: string;
    ToCurrency?: string;
    FromCurrencyName?: string;
    ToCurrencyName?: string;
  } | null;
  isLoadingExchangeRate?: boolean;
  isEditingExchangeRate?: boolean;
  setIsEditingExchangeRate?: (v: boolean) => void;
  customExchangeRate?: string;
  setCustomExchangeRate?: (v: string) => void;
  // Additional props for edit mode
  exchangeRateDate?: string;
  fromCurrency?: string;
  toCurrency?: string;
  partyWithLocations?: PartyWithLocations | null;
}

export const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  form,
  invoiceItems,
  setInvoiceItems,
  isFormDisabled,
  currencyLabel,
  existingFiles,
  attachments,
  onExistingFileRemove,
  onNewFileAdd,
  onNewFileRemove,
  isDifferentCurrency,
  exchangeRateData,
  isLoadingExchangeRate,
  isEditingExchangeRate,
  setIsEditingExchangeRate,
  customExchangeRate,
  setCustomExchangeRate,
  exchangeRateDate,
  fromCurrency,
  toCurrency,
  partyWithLocations,
}) => {
  return (
    <div>
      <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-base sm:text-lg font-medium">
          Sales Invoice Item Table
        </h3>
        {isDifferentCurrency &&
          (isLoadingExchangeRate ? (
            <div className="text-sm text-muted-foreground">
              Loading exchange rate...
            </div>
          ) : (
            <div className="space-y-1">
              {isEditingExchangeRate && !isFormDisabled ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    1 {fromCurrency || exchangeRateData?.FromCurrency || ""} =
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={customExchangeRate}
                    onChange={(e) => setCustomExchangeRate?.(e.target.value)}
                    className="h-8 w-32 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    autoFocus
                  />
                  <span className="text-sm">
                    {toCurrency || exchangeRateData?.ToCurrency || ""}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setIsEditingExchangeRate?.(false);
                      toast.success("Exchange rate updated");
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (exchangeRateData?.Rate !== undefined) {
                        setCustomExchangeRate?.(
                          exchangeRateData.Rate.toFixed(3)
                        );
                      }
                      setIsEditingExchangeRate?.(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>
                    (As on{" "}
                    {
                      (
                        exchangeRateDate ||
                        new Date().toISOString().split("T")[0]
                      ).split("T")[0]
                    }
                    ) 1 {fromCurrency || exchangeRateData?.FromCurrency || ""} ={" "}
                    {(
                      parseFloat(customExchangeRate || "0") ||
                      exchangeRateData?.Rate ||
                      0
                    ).toFixed(3)}{" "}
                    {toCurrency || exchangeRateData?.ToCurrency || ""}
                  </span>
                  {!isFormDisabled && (
                    <button
                      type="button"
                      onClick={() => setIsEditingExchangeRate?.(true)}
                      title="Edit Exchange Rate"
                    >
                      <Pencil className="h-3 w-3 text-primary" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      <div className="w-full space-y-2">
        <InvoiceItemsTable
          items={invoiceItems}
          setItems={setInvoiceItems}
          disabled={isFormDisabled}
          isDifferentCurrency={isDifferentCurrency}
          exchangeRate={(() => {
            // Fall back to fetched rate when custom value is blank
            const rateStr =
              (customExchangeRate ?? "").trim() ||
              exchangeRateData?.Rate?.toString();
            const rateNum = rateStr ? parseFloat(rateStr) : undefined;
            return isDifferentCurrency ? rateNum : undefined;
          })()}
        />

        <TaxCalculationSummary
          form={form}
          isFormDisabled={isFormDisabled}
          items={invoiceItems}
          currencyLabel={currencyLabel}
          partyWithLocations={partyWithLocations}
        />

        <div className="mt-6">
          <AttachmentManager
            existingFiles={existingFiles}
            onExistingFileRemove={onExistingFileRemove}
            onNewFileAdd={onNewFileAdd}
            onNewFileRemove={onNewFileRemove}
            newFiles={attachments}
            module="invoice"
            readOnly={isFormDisabled}
          />
        </div>
      </div>
    </div>
  );
};
