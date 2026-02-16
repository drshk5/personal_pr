import React, { useCallback, useMemo, useEffect, useRef } from "react";
import { format } from "date-fns";
import { AlertCircle, X, FileText, Loader2 } from "lucide-react";

import type { ColumnDefinition } from "@/components/data-display/data-tables/DataEntryTable";
import { DataEntryTable } from "@/components/data-display/data-tables/DataEntryTable";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { usePendingInvoicesByCustomer } from "@/hooks/api/Account/use-sales-invoices";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PaymentReceivedItem {
  strPaymentReceived_ItemGUID?: string;
  strInvoiceGUID: string;
  dtPaymentReceivedOn: string;
  dblPaymentAmount: number;
  strInvoiceNo?: string;
  dInvoiceDate?: string;
  dblInvoiceAmount?: number;
  dblPendingAmount?: number;
  dblUnProcessedAmount?: number;
  originalPaymentAmount?: number;
  manuallyEdited?: boolean;
  warningDismissed?: boolean;
}

interface PaymentReceivedItemsTableProps {
  items: PaymentReceivedItem[];
  onItemsChange: (items: PaymentReceivedItem[]) => void;
  disabled?: boolean;
  customerGUID?: string;
  customerCurrency?: string;
  amountReceived?: number;
  isEditMode?: boolean;
}

export const PaymentReceivedItemsTable: React.FC<
  PaymentReceivedItemsTableProps
> = ({
  items,
  onItemsChange,
  disabled = false,
  customerGUID,
  customerCurrency = "INR",
  amountReceived = 0,
  isEditMode = false,
}) => {
  const previousCustomerGUID = useRef<string | undefined>(undefined);

  // Fetch pending invoices for the selected customer
  // In edit mode, don't fetch pending invoices as data comes from usePaymentReceivedById
  const { data: pendingInvoicesData, isFetching } =
    usePendingInvoicesByCustomer(
      customerGUID
        ? {
            strCustomerGUID: customerGUID,
          }
        : undefined,
      {
        enabled: !!customerGUID && !isEditMode,
      }
    );

  const pendingInvoices = useMemo(
    () => pendingInvoicesData || [],
    [pendingInvoicesData]
  );

  // Auto-populate table with all pending invoices when customer changes
  useEffect(() => {
    // No customer selected: clear and reset tracking
    if (!customerGUID) {
      if (items.length > 0) {
        onItemsChange([]);
      }
      previousCustomerGUID.current = undefined;
      return;
    }

    // Skip if still loading
    if (isFetching) return;

    // First mount with a customer
    if (!previousCustomerGUID.current) {
      // If items already exist (edit mode), update them with fresh pending amounts from API
      if (items.length > 0 && isEditMode) {
        const updatedItems = items.map((item) => {
          const freshInvoiceData = pendingInvoices.find(
            (inv) => inv.strInvoiceGUID === item.strInvoiceGUID
          );

          // If invoice found in pending list, update pending amount and invoice details
          if (freshInvoiceData) {
            return {
              ...item,
              dblInvoiceAmount:
                freshInvoiceData.dblNetAmt || item.dblInvoiceAmount,
              dblPendingAmount: freshInvoiceData.dblPendingAmount || 0,
              dblUnProcessedAmount:
                freshInvoiceData.dblUnProcessedAmount ?? undefined,
              strInvoiceNo: freshInvoiceData.strInvoiceNo || item.strInvoiceNo,
              dInvoiceDate: freshInvoiceData.dInvoiceDate || item.dInvoiceDate,
            };
          }

          // Invoice not in pending list (already fully paid or inactive)
          return item;
        });
        onItemsChange(updatedItems);
        previousCustomerGUID.current = customerGUID;
        return;
      }

      // If items already exist in create mode, keep them as is
      if (items.length > 0) {
        previousCustomerGUID.current = customerGUID;
        return;
      }

      // Create mode first load: populate from pending invoices or empty
      if (pendingInvoices.length > 0) {
        const populatedItems: PaymentReceivedItem[] = pendingInvoices.map(
          (invoice) => ({
            strPaymentReceived_ItemGUID: crypto.randomUUID(),
            strInvoiceGUID: invoice.strInvoiceGUID,
            dtPaymentReceivedOn: new Date().toISOString().split("T")[0],
            dblPaymentAmount: 0,
            strInvoiceNo: invoice.strInvoiceNo,
            dInvoiceDate: invoice.dInvoiceDate,
            dblInvoiceAmount: invoice.dblNetAmt || 0,
            dblPendingAmount: invoice.dblPendingAmount || 0,
            dblUnProcessedAmount: invoice.dblUnProcessedAmount ?? undefined,
          })
        );
        onItemsChange(populatedItems);
      } else {
        onItemsChange([]);
      }

      previousCustomerGUID.current = customerGUID;
      return;
    }

    // Customer changed after initial mount
    if (previousCustomerGUID.current !== customerGUID) {
      if (pendingInvoices.length > 0) {
        const populatedItems: PaymentReceivedItem[] = pendingInvoices.map(
          (invoice) => ({
            strPaymentReceived_ItemGUID: crypto.randomUUID(),
            strInvoiceGUID: invoice.strInvoiceGUID,
            dtPaymentReceivedOn: new Date().toISOString().split("T")[0],
            dblPaymentAmount: 0,
            strInvoiceNo: invoice.strInvoiceNo,
            dInvoiceDate: invoice.dInvoiceDate,
            dblInvoiceAmount: invoice.dblNetAmt || 0,
            dblPendingAmount: invoice.dblPendingAmount || 0,
            dblUnProcessedAmount: invoice.dblUnProcessedAmount ?? undefined,
          })
        );
        onItemsChange(populatedItems);
      } else {
        onItemsChange([]);
      }

      previousCustomerGUID.current = customerGUID;
    }
  }, [
    customerGUID,
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
    (itemId: string, field: keyof PaymentReceivedItem, value: string) => {
      onItemsChange(
        items.map((item) => {
          if (
            item.strPaymentReceived_ItemGUID === itemId ||
            (!item.strPaymentReceived_ItemGUID &&
              item.strInvoiceGUID === itemId)
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
    () => items.reduce((sum, item) => sum + (item.dblPaymentAmount || 0), 0),
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

  const columns: ColumnDefinition<PaymentReceivedItem>[] = useMemo(
    () => [
      {
        key: "invoiceDate",
        label: "INVOICE DATE",
        width: "w-[12%]",
        align: "left",
        render: (item) =>
          item.dInvoiceDate ? (
            <div className="text-base pl-2 mt-3">
              {format(new Date(item.dInvoiceDate), "dd/MM/yyyy")}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground"></div>
          ),
      },
      {
        key: "invoiceNumber",
        label: "SALES INVOICE NUMBER",
        width: "w-[18%]",
        align: "left",
        render: (item) => (
          <div className="text-base font-medium pl-3 mt-4">
            {item.strInvoiceNo || ""}
          </div>
        ),
      },
      {
        key: "invoiceAmount",
        label: "SALES INVOICE AMOUNT",
        width: "w-[15%]",
        align: "right",
        render: (item) => (
          <div className="text-right text-base pr-3 mt-4">
            {inrFormatter.format(item.dblInvoiceAmount || 0)}
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
        key: "paymentReceivedOn",
        label: "PAYMENT RECEIVED ON",
        width: "w-[20%]",
        align: "left",
        render: (item, _index, onUpdate) => (
          <div className="p-1 mt-1">
            <DatePicker
              className={`${fieldCard} w-full`}
              value={
                item.dtPaymentReceivedOn
                  ? new Date(item.dtPaymentReceivedOn)
                  : undefined
              }
              onChange={(date: Date | undefined) =>
                onUpdate(
                  "dtPaymentReceivedOn",
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
            (item.dblPaymentAmount || 0) > amountReceived &&
            amountReceived > 0;

          return (
            <div className="flex flex-col gap-1 py-2">
              <div className="relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={normalizedPayment}
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    const parsed = v === "" ? null : parseFloat(v);
                    const itemId =
                      item.strPaymentReceived_ItemGUID || item.strInvoiceGUID;
                    onItemsChange(
                      items.map((itm) => {
                        const itmId =
                          itm.strPaymentReceived_ItemGUID || itm.strInvoiceGUID;
                        if (itmId === itemId) {
                          return {
                            ...itm,
                            dblPaymentAmount: parsed ?? 0,
                            manuallyEdited: true,
                            warningDismissed: false, // Reset warning when value changes
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
                            item.strPaymentReceived_ItemGUID ||
                            item.strInvoiceGUID;
                          onItemsChange(
                            items.map((itm) => {
                              const itmId =
                                itm.strPaymentReceived_ItemGUID ||
                                itm.strInvoiceGUID;
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
                                The excess amount will be credited to the
                                customer
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs leading-snug">
                          The amount entered here is <br />
                          more than amount paid
                          <br /> by the customer..
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
      amountReceived,
      items,
      onItemsChange,
      isEditMode,
    ]
  );

  // Show empty state if no pending invoices
  if (customerGUID && !isFetching && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-muted-foreground">
            No Unpaid Sales Invoices
          </p>
          <p className="text-sm text-muted-foreground">
            All invoices for this customer have been paid or there are no
            pending invoices.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state when fetching pending invoices
  if (isFetching && customerGUID && !isEditMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12 border border-dashed rounded-lg bg-muted/20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading pending sales invoices...
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
          item.strPaymentReceived_ItemGUID || item.strInvoiceGUID || ""
        }
        getItemKey={(item, index) =>
          item.strPaymentReceived_ItemGUID ||
          item.strInvoiceGUID ||
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
              <span>Amount Received:</span>
              <span>{inrFormatter.format(amountReceived)}</span>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span>Amount in Excess:</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p>
                        The extra amount of{" "}
                        <span className="font-semibold">
                          {customerCurrency}{" "}
                          {inrFormatter.format(
                            Math.max(0, amountReceived - totalPaymentAmount)
                          )}
                        </span>{" "}
                        will be deposited to the customer's account.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span>
                {customerCurrency}{" "}
                {inrFormatter.format(amountReceived - totalPaymentAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
