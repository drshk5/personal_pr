import React, { useCallback, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AlertCircle, X, FileText, Loader2 } from "lucide-react";

import type { ColumnDefinition } from "@/components/data-display/data-tables/DataEntryTable";
import { DataEntryTable } from "@/components/data-display/data-tables/DataEntryTable";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { usePendingPaymentsByVendor } from "@/hooks/api/Account/use-purchase-invoices";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentMadeItem {
  strPaymentMade_ItemGUID?: string;
  strPurchaseInvoiceGUID: string;
  dtPaymentMadeOn: string;
  dblPaymentAmount: number;
  strPurchaseInvoiceNo?: string;
  dPurchaseInvoiceDate?: string;
  dblPurchaseInvoiceAmount?: number;
  dblPendingAmount?: number;
  dblUnProcessedAmount?: number;
  manuallyEdited?: boolean;
  warningDismissed?: boolean;
}

interface PaymentMadeItemsTableProps {
  items: PaymentMadeItem[];
  onItemsChange: (items: PaymentMadeItem[]) => void;
  disabled?: boolean;
  vendorGUID?: string;
  vendorCurrency?: string;
  amountPaid?: number;
  isEditMode?: boolean;
}

export const PaymentMadeItemsTable: React.FC<PaymentMadeItemsTableProps> = ({
  items,
  onItemsChange,
  disabled = false,
  vendorGUID,
  vendorCurrency = "INR",
  amountPaid = 0,
  isEditMode = false,
}) => {
  const previousVendorGUID = useRef<string | undefined>(undefined);

  // Fetch pending invoices for the selected vendor
  const { data: pendingInvoicesData, isFetching } = usePendingPaymentsByVendor(
    vendorGUID
      ? {
          strVendorGUID: vendorGUID,
        }
      : undefined,
    {
      enabled: !!vendorGUID && !isEditMode,
    }
  );

  const pendingInvoices = useMemo(
    () => pendingInvoicesData || [],
    [pendingInvoicesData]
  );

  // Auto-populate and update items with latest pending invoice data when vendor changes or in edit mode
  useEffect(() => {
    // No vendor selected: clear and reset tracking
    if (!vendorGUID) {
      if (items.length > 0) {
        onItemsChange([]);
      }
      previousVendorGUID.current = undefined;
      return;
    }

    if (isFetching) return;

    // First mount with a vendor
    if (!previousVendorGUID.current) {
      // If items already exist (edit mode), update them with fresh pending amounts from API
      if (items.length > 0 && isEditMode) {
        const updatedItems = items.map((item) => {
          const freshInvoiceData = pendingInvoices.find(
            (inv) => inv.strPurchaseInvoiceGUID === item.strPurchaseInvoiceGUID
          );
          if (freshInvoiceData) {
            return {
              ...item,
              dblPurchaseInvoiceAmount:
                freshInvoiceData.dblNetAmt || item.dblPurchaseInvoiceAmount,
              dblPendingAmount: freshInvoiceData.dblPendingAmount || 0,
              dblUnProcessedAmount:
                freshInvoiceData.dblUnProcessedAmount ?? undefined,
              strPurchaseInvoiceNo:
                freshInvoiceData.strPurchaseInvoiceNo ||
                item.strPurchaseInvoiceNo,
              dPurchaseInvoiceDate:
                freshInvoiceData.dPurchaseInvoiceDate ||
                item.dPurchaseInvoiceDate,
            };
          }
          return item;
        });
        onItemsChange(updatedItems);
        previousVendorGUID.current = vendorGUID;
        return;
      }

      // If items already exist in create mode, keep them as is
      if (items.length > 0) {
        previousVendorGUID.current = vendorGUID;
        return;
      }

      // Create mode first load: populate from pending invoices or empty
      if (pendingInvoices.length > 0) {
        const populatedItems: PaymentMadeItem[] = pendingInvoices.map(
          (invoice) => ({
            strPaymentMade_ItemGUID: crypto.randomUUID(),
            strPurchaseInvoiceGUID: invoice.strPurchaseInvoiceGUID,
            dtPaymentMadeOn: new Date().toISOString().split("T")[0],
            dblPaymentAmount: 0,
            strPurchaseInvoiceNo: invoice.strPurchaseInvoiceNo,
            dPurchaseInvoiceDate: invoice.dPurchaseInvoiceDate,
            dblPurchaseInvoiceAmount: invoice.dblNetAmt || 0,
            dblPendingAmount: invoice.dblPendingAmount || 0,
            dblUnProcessedAmount: invoice.dblUnProcessedAmount ?? undefined,
          })
        );
        onItemsChange(populatedItems);
      } else {
        onItemsChange([]);
      }

      previousVendorGUID.current = vendorGUID;
      return;
    }

    // Vendor changed after initial mount
    if (previousVendorGUID.current !== vendorGUID) {
      if (pendingInvoices.length > 0) {
        const populatedItems: PaymentMadeItem[] = pendingInvoices.map(
          (invoice) => ({
            strPaymentMade_ItemGUID: crypto.randomUUID(),
            strPurchaseInvoiceGUID: invoice.strPurchaseInvoiceGUID,
            dtPaymentMadeOn: new Date().toISOString().split("T")[0],
            dblPaymentAmount: 0,
            strPurchaseInvoiceNo: invoice.strPurchaseInvoiceNo,
            dPurchaseInvoiceDate: invoice.dPurchaseInvoiceDate,
            dblPurchaseInvoiceAmount: invoice.dblNetAmt || 0,
            dblPendingAmount: invoice.dblPendingAmount || 0,
            dblUnProcessedAmount: invoice.dblUnProcessedAmount ?? undefined,
          })
        );
        onItemsChange(populatedItems);
      } else {
        onItemsChange([]);
      }

      previousVendorGUID.current = vendorGUID;
    }
  }, [
    vendorGUID,
    pendingInvoices,
    onItemsChange,
    isFetching,
    isEditMode,
    items,
  ]);

  const fieldCard =
    "bg-muted/30 dark:bg-card border border-transparent rounded-md hover:border-primary/60 transition-colors shadow-none disabled:border-none disabled:bg-muted/20 dark:disabled:bg-card disabled:cursor-not-allowed";
  const inputCard = `${fieldCard} text-right focus-visible:ring-0 focus-visible:ring-offset-0`;

  const handleItemUpdate = useCallback(
    (itemId: string, field: keyof PaymentMadeItem, value: string) => {
      onItemsChange(
        items.map((item) => {
          if (
            item.strPaymentMade_ItemGUID === itemId ||
            (!item.strPaymentMade_ItemGUID &&
              item.strPurchaseInvoiceGUID === itemId)
          ) {
            if (field === "dblPaymentAmount") {
              return { ...item, [field]: parseFloat(value) || 0 };
            }
            return { ...item, [field]: value };
          }
          return item;
        })
      );
    },
    [items, onItemsChange]
  );

  const totalPaymentAmount = useMemo(
    () => items.reduce((sum, item) => sum + (item.dblPaymentAmount ?? 0), 0),
    [items]
  );

  const amountRefunded = 0;

  const inrFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }),
    []
  );

  const columns: ColumnDefinition<PaymentMadeItem>[] = useMemo(
    () => [
      {
        key: "invoiceDate",
        label: "PURCHASE INVOICE DATE",
        width: "w-[12%]",
        align: "left",
        render: (item) =>
          item.dPurchaseInvoiceDate ? (
            <div className="text-base pl-2 mt-3">
              {format(new Date(item.dPurchaseInvoiceDate), "dd/MM/yyyy")}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground"></div>
          ),
      },
      {
        key: "invoiceNumber",
        label: "PURCHASE INVOICE NUMBER",
        width: "w-[18%]",
        align: "left",
        render: (item) => {
          return (
            <div className="text-base font-medium pl-3 mt-4">
              {item.strPurchaseInvoiceNo || ""}
            </div>
          );
        },
      },
      {
        key: "invoiceAmount",
        label: "PURCHASE INVOICE AMOUNT",
        width: "w-[19%]",
        align: "right",
        render: (item) => (
          <div className="text-right text-base pr-3 mt-4">
            {inrFormatter.format(item.dblPurchaseInvoiceAmount || 0)}
          </div>
        ),
      },
      {
        key: "amountDue",
        label: "AMOUNT DUE",
        width: "w-[15%]",
        align: "right",
        render: (item) => (
          <div className="text-right pr-3 mt-4">
            <div className="space-y-1">
              <div className="text-base">
                {inrFormatter.format(item.dblPendingAmount || 0)}
              </div>
              {item.dblUnProcessedAmount != null &&
                item.dblUnProcessedAmount > 0 && (
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <FileText className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Unprocessed amount</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">
                      {inrFormatter.format(item.dblUnProcessedAmount)}
                    </span>
                  </div>
                )}
            </div>
          </div>
        ),
      },
      {
        key: "paymentMadeOn",
        label: "PAYMENT MADE ON",
        width: "w-[20%]",
        align: "left",
        render: (item, _index, onUpdate) => (
          <div className="p-1 mt-1">
            <DatePicker
              className={`${fieldCard} w-full`}
              value={
                item.dtPaymentMadeOn
                  ? new Date(item.dtPaymentMadeOn)
                  : undefined
              }
              onChange={(date: Date | undefined) =>
                onUpdate(
                  "dtPaymentMadeOn",
                  date ? format(date, "yyyy-MM-dd") : ""
                )
              }
              disabled={disabled}
            />
          </div>
        ),
      },
      {
        key: "payment",
        label: "PAYMENT",
        width: "w-[20%]",
        align: "right",
        render: (item, _index, onUpdate) => {
          const normalizedPayment =
            item.dblPaymentAmount === 0 || item.dblPaymentAmount == null
              ? ""
              : item.dblPaymentAmount;

          const isExceedingAvailable =
            item.manuallyEdited &&
            !item.warningDismissed &&
            (item.dblPaymentAmount || 0) > amountPaid &&
            amountPaid > 0;

          return (
            <div className="flex flex-col gap-1 py-2">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={normalizedPayment}
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    const parsed = v === "" ? 0 : parseFloat(v);
                    const itemId =
                      item.strPaymentMade_ItemGUID ||
                      item.strPurchaseInvoiceGUID;
                    onItemsChange(
                      items.map((itm) => {
                        const itmId =
                          itm.strPaymentMade_ItemGUID ||
                          itm.strPurchaseInvoiceGUID;
                        if (itmId === itemId) {
                          return {
                            ...itm,
                            dblPaymentAmount: isNaN(parsed) ? 0 : parsed,
                            manuallyEdited: true,
                            warningDismissed: false,
                          };
                        }
                        return itm;
                      })
                    );
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  placeholder="0.00"
                  className={`${inputCard} ${isExceedingAvailable ? "border-yellow-500 dark:border-yellow-600" : ""}`}
                  disabled={disabled}
                />
                {isExceedingAvailable && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 px-1">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded shadow-lg relative">
                      <button
                        type="button"
                        onClick={() => {
                          const itemId =
                            item.strPaymentMade_ItemGUID ||
                            item.strPurchaseInvoiceGUID;
                          onItemsChange(
                            items.map((itm) => {
                              const itmId =
                                itm.strPaymentMade_ItemGUID ||
                                itm.strPurchaseInvoiceGUID;
                              if (itmId === itemId) {
                                return { ...itm, warningDismissed: true };
                              }
                              return itm;
                            })
                          );
                        }}
                        className="absolute top-1 right-1 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 rounded p-0.5 transition-colors"
                        aria-label="Close warning"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="flex items-start gap-1.5 pr-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>
                                The excess amount will be debited from the
                                vendor
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs leading-snug">
                          The amount entered here is <br />
                          more than amount paid
                          <br /> to the vendor.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {item.dblPendingAmount != null &&
                item.dblPendingAmount > 0 &&
                !isEditMode && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary/85 cursor-pointer text-right pr-1"
                    onClick={() => {
                      if (item.dblPendingAmount) {
                        onUpdate(
                          "dblPaymentAmount",
                          item.dblPendingAmount.toString()
                        );
                      }
                    }}
                    disabled={disabled}
                  >
                    Pay in Full
                  </button>
                )}
            </div>
          );
        },
      },
    ],
    [
      disabled,
      inputCard,
      inrFormatter,
      amountPaid,
      items,
      onItemsChange,
      isEditMode,
    ]
  );

  // Show empty state if no pending invoices
  if (vendorGUID && !isFetching && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-muted-foreground">
            No Unpaid Purchase Invoices
          </p>
          <p className="text-sm text-muted-foreground">
            All invoices for this vendor have been paid or there are no pending
            invoices.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state when fetching pending invoices
  if (isFetching && vendorGUID && !isEditMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12 border border-border rounded-lg bg-muted/20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading pending purchase invoices...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataEntryTable
        items={items}
        columns={columns}
        onItemUpdate={handleItemUpdate}
        onDeleteItem={undefined}
        onAddItem={undefined}
        getItemId={(item) =>
          item.strPaymentMade_ItemGUID || item.strPurchaseInvoiceGUID || ""
        }
        getItemKey={(item, index) =>
          item.strPaymentMade_ItemGUID ||
          item.strPurchaseInvoiceGUID ||
          `payment-item-${index}`
        }
        disabled={disabled}
      />

      <div className="text-xs text-muted-foreground">
        **List reflects only SENT Sales Invoices
      </div>

      <div className="flex justify-end">
        <div className="w-full md:w-2/5 lg:w-1/3 space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold pt-3">
            <span>Total</span>
            <span>{inrFormatter.format(totalPaymentAmount)}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Amount Paid:</span>
              <span>{inrFormatter.format(amountPaid)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Amount used for Payments:</span>
              <span>{inrFormatter.format(totalPaymentAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>Amount Refunded:</span>
              <span>{inrFormatter.format(amountRefunded)}</span>
            </div>

            <div className="flex justify-between items-center font-medium">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>Amount in Excess:</span>
              </div>
              <span>
                {vendorCurrency}{" "}
                {inrFormatter.format(amountPaid - totalPaymentAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
