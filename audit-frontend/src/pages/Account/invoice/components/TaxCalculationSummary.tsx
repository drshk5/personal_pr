import React, { useMemo, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Button } from "@/components/ui/button";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "@/validations/Account/salesinvoice";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import type { InvoiceItem } from "@/types/Account/salesinvoice";
import type { ScheduleTreeNode } from "@/types/Account/account";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { Label } from "@/components/ui/label";
import type { PartyWithLocations } from "@/types/Account/party";

interface TaxCalculationSummaryProps {
  form: UseFormReturn<FormData>;
  isFormDisabled: boolean;
  items: InvoiceItem[];
  currencyLabel?: string;
  partyWithLocations?: PartyWithLocations | null;
}

export const TaxCalculationSummary: React.FC<TaxCalculationSummaryProps> = ({
  form,
  isFormDisabled,
  items,
  currencyLabel,
  partyWithLocations,
}) => {
  const [isEditingAdjustmentName, setIsEditingAdjustmentName] = useState(false);
  const [adjustmentEditValue, setAdjustmentEditValue] = useState<string | null>(
    null
  );
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedAccountGUID, setSelectedAccountGUID] = useState<string>("");
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [hasPrefetchedExisting, setHasPrefetchedExisting] = useState(false);
  const adjustmentName = form.watch("strAdjustmentName");
  const adjustmentAccountGUID = form.watch("strAdjustment_AccountGUID");
  const { user } = useAuthContext();
  const userTax = (
    user as
      | {
          tax?: {
            strTaxTypeCode?: string | null;
            strTaxTypeName?: string | null;
            strStateGUID?: string | null;
          };
        }
      | undefined
  )?.tax;
  const hasTaxConfig = !!userTax;
  const rawTaxTypeCode = hasTaxConfig ? (userTax?.strTaxTypeCode ?? "") : "";
  const taxTypeCode = rawTaxTypeCode?.toUpperCase?.() ?? "";
  const isGSTRegime = hasTaxConfig
    ? taxTypeCode
      ? taxTypeCode.startsWith("GST")
      : true
    : false;
  // isSalesTaxRegime and VAT are handled as single-tax regimes (not GST)
  const taxDisplayLabel = isGSTRegime
    ? "GST"
    : (userTax?.strTaxTypeName ?? taxTypeCode) || "Tax";
  const selectedPartyGUID = form.watch("strPartyGUID");

  // Fetch accounts tree for adjustment account selection
  // Allow fetch when dropdown opens, or if there's an adjustment account GUID and we haven't prefetched yet
  const shouldPrefetchExisting =
    !!adjustmentAccountGUID && !hasPrefetchedExisting;
  const accountsEnabled = isAccountDropdownOpen || shouldPrefetchExisting;

  // Fetch accounts tree for adjustment account selection
  const { data: accountsTreeData } = useAccountsByTypesTree(
    {
      strAccountTypeGUIDs: "",
      maxLevel: 0,
    },
    { enabled: accountsEnabled }
  );

  useEffect(() => {
    if (accountsTreeData && shouldPrefetchExisting) {
      setHasPrefetchedExisting(true);
    }
  }, [accountsTreeData, shouldPrefetchExisting]);

  // Map accounts tree to flat list with indentation
  const accountOptions = useMemo(() => {
    if (!accountsTreeData?.scheduleTree)
      return [] as { value: string; label: string; name: string }[];

    const mapTree = (
      nodes: ScheduleTreeNode[],
      depth: number = 0
    ): { value: string; label: string; name: string }[] => {
      return nodes.flatMap((node) => {
        const indent = "  ".repeat(depth);
        const accountItems =
          node.accounts
            ?.filter((account) => account.bolIsActive)
            .map((account) => ({
              value: account.strAccountGUID,
              label: `${indent}${account.strAccountName}`,
              name: account.strAccountName,
            })) || [];
        const childItems = node.children
          ? mapTree(node.children, depth + 1)
          : [];
        return [...accountItems, ...childItems];
      });
    };

    return mapTree(accountsTreeData.scheduleTree);
  }, [accountsTreeData]);

  // Get selected account name
  const selectedAccountName = useMemo(() => {
    if (!adjustmentAccountGUID) return null;
    const account = accountOptions.find(
      (acc) => acc.value === adjustmentAccountGUID
    );
    return account?.name || null;
  }, [adjustmentAccountGUID, accountOptions]);

  // Initialize selected account when dialog opens
  useEffect(() => {
    if (isAccountDialogOpen && adjustmentAccountGUID) {
      setSelectedAccountGUID(adjustmentAccountGUID);
    } else if (!isAccountDialogOpen) {
      setSelectedAccountGUID("");
    }
  }, [isAccountDialogOpen, adjustmentAccountGUID]);

  const toNumber = (val: unknown): number => {
    if (typeof val === "number") return val;
    const parsed = parseFloat(val as string);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const round3 = (n: number) => +n.toFixed(3);

  const formatAmount = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);
  };

  const allValues = form.getValues();
  const adjustmentAmt = allValues.dblAdjustmentAmt || 0;

  // Aggregate-only: use item fields, not recomputation
  const { subtotal, totalDiscount } = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        const taxable = toNumber(it.dblTotalAmt || 0);
        const discount = toNumber(it.dblDiscountAmt || 0);
        acc.subtotal += taxable;
        acc.totalDiscount += discount;
        return acc;
      },
      { subtotal: 0, totalDiscount: 0 }
    );
  }, [items]);

  const hasCustomer = !!selectedPartyGUID;
  const canCalculate = hasCustomer && subtotal > 0;
  const shouldCalculateTax = hasTaxConfig && canCalculate;

  // For GST, determine inter/intra state based on organization tax config state vs party billing state
  const orgStateGUID = userTax?.strStateGUID ?? null;
  const billingStateGUID =
    partyWithLocations?.billingAddress?.strStateGUID ?? null;
  const isIntraState =
    isGSTRegime &&
    shouldCalculateTax &&
    orgStateGUID &&
    billingStateGUID &&
    orgStateGUID === billingStateGUID;

  const taxBreakdown = useMemo(() => {
    if (!shouldCalculateTax) {
      return {
        totalIGST: 0,
        totalCGST: 0,
        totalSGST: 0,
        totalSingleTax: 0,
        totalTax: 0,
      };
    }

    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalSingleTax = 0; // Used for VAT, Sales Tax, and other single-tax regimes

    for (const it of items) {
      const itemTax = toNumber(it.dblTaxAmt || 0);
      if (itemTax <= 0) continue;

      if (isGSTRegime) {
        if (isIntraState) {
          const half = round3(itemTax / 2);
          totalCGST += half;
          totalSGST += round3(itemTax - half); // keep sum consistent
        } else {
          totalIGST += itemTax;
        }
      } else {
        totalSingleTax += itemTax;
      }
    }

    totalIGST = round3(totalIGST);
    totalCGST = round3(totalCGST);
    totalSGST = round3(totalSGST);
    totalSingleTax = round3(totalSingleTax);
    const totalTax = isGSTRegime
      ? round3(totalIGST + totalCGST + totalSGST)
      : totalSingleTax;

    return {
      totalIGST,
      totalCGST,
      totalSGST,
      totalSingleTax,
      totalTax,
    };
  }, [items, isIntraState, isGSTRegime, shouldCalculateTax]);

  // Push aggregate tax back to form so Net total stays in sync
  useEffect(() => {
    if (shouldCalculateTax) {
      form.setValue("dblTaxAmt", taxBreakdown.totalTax, {
        shouldValidate: true,
      });
    } else {
      form.setValue("dblTaxAmt", 0, { shouldValidate: true });
    }
  }, [taxBreakdown.totalTax, form, shouldCalculateTax]);

  // Keep subtotal and net amount synchronized with current items and adjustment
  useEffect(() => {
    if (!canCalculate) return;
    const effectiveSubtotal = round3(subtotal);
    const effectiveTax = round3(taxBreakdown.totalTax);
    const effectiveAdjustment = round3(adjustmentAmt || 0);
    const effectiveNet = round3(
      effectiveSubtotal + effectiveTax + effectiveAdjustment
    );

    form.setValue("dblGrossTotalAmt", effectiveSubtotal, {
      shouldValidate: true,
    });
    form.setValue("dblTotalDiscountAmt", +totalDiscount.toFixed(3), {
      shouldValidate: true,
    });
    form.setValue("dblNetAmt", effectiveNet, { shouldValidate: true });
  }, [
    canCalculate,
    subtotal,
    taxBreakdown.totalTax,
    adjustmentAmt,
    totalDiscount,
    form,
  ]);

  const handleAdjustmentChange = (value: string) => {
    const adjustmentValue =
      value === "" || value === "-" ? 0 : parseFloat(value) || 0;

    form.setValue("dblAdjustmentAmt", adjustmentValue, {
      shouldValidate: true,
    });

    // Clear adjustment account GUID if adjustment amount is zero
    if (adjustmentValue === 0) {
      form.setValue("strAdjustment_AccountGUID", null, {
        shouldValidate: true,
      });
    }

    const tax = shouldCalculateTax ? taxBreakdown.totalTax || 0 : 0;
    const newNetAmount = round3(subtotal + tax + adjustmentValue);
    form.setValue("dblNetAmt", newNetAmount);
  };

  const handleAccountUpdate = () => {
    form.setValue("strAdjustment_AccountGUID", selectedAccountGUID || null, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsAccountDialogOpen(false);
  };

  return (
    <div className="mt-4">
      <div className="w-full lg:w-1/2 ml-auto">
        <div className="flex justify-between py-2 px-3 sm:px-4">
          <div className="font-semibold text-base sm:text-lg">Gross Total</div>
          <div className="text-right font-semibold text-base sm:text-lg">
            {formatAmount(typeof subtotal === "number" ? subtotal : 0)}
          </div>
        </div>

        {hasTaxConfig &&
          (!canCalculate ? (
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 py-2 px-3 sm:px-4">
              <div className="font-medium flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base">
                <span>Tax Applied</span>
              </div>
            </div>
          ) : isGSTRegime ? (
            isIntraState ? (
              <>
                <div className="flex justify-between py-2 px-3 sm:px-4">
                  <div className="font-medium text-sm sm:text-base">CGST</div>
                  <div className="text-right text-sm sm:text-base">
                    {formatAmount(taxBreakdown.totalCGST)}
                  </div>
                </div>
                <div className="flex justify-between py-2 px-3 sm:px-4">
                  <div className="font-medium text-sm sm:text-base">SGST</div>
                  <div className="text-right text-sm sm:text-base">
                    {formatAmount(taxBreakdown.totalSGST)}
                  </div>
                </div>
                <div className="flex justify-between py-2 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-700 mt-1">
                  <div className="font-medium text-sm sm:text-base">
                    Total Tax Amount
                  </div>
                  <div className="text-right font-medium text-sm sm:text-base">
                    {formatAmount(taxBreakdown.totalTax)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-2 px-3 sm:px-4">
                  <div className="font-medium text-sm sm:text-base">IGST</div>
                  <div className="text-right text-sm sm:text-base">
                    {formatAmount(taxBreakdown.totalIGST)}
                  </div>
                </div>
                <div className="flex justify-between py-2 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-700 mt-1">
                  <div className="font-medium text-sm sm:text-base">
                    Total Tax Amount
                  </div>
                  <div className="text-right font-medium text-sm sm:text-base">
                    {formatAmount(taxBreakdown.totalTax)}
                  </div>
                </div>
              </>
            )
          ) : (
            <>
              <div className="flex justify-between py-2 px-3 sm:px-4">
                <div className="font-medium text-sm sm:text-base">
                  {taxDisplayLabel || "Tax"}
                </div>
                <div className="text-right text-sm sm:text-base">
                  {formatAmount(taxBreakdown.totalSingleTax)}
                </div>
              </div>
              <div className="flex justify-between py-2 px-3 sm:px-4 border-t border-gray-200 dark:border-gray-700 mt-1">
                <div className="font-medium text-sm sm:text-base">
                  Total Tax Amount
                </div>
                <div className="text-right font-medium text-sm sm:text-base">
                  {formatAmount(taxBreakdown.totalTax)}
                </div>
              </div>
            </>
          ))}

        <div className="flex justify-between items-center py-2 px-3 sm:px-4">
          <div className="font-medium text-sm sm:text-base">
            <div className="flex flex-col gap-1">
              {isEditingAdjustmentName && !isFormDisabled ? (
                <Input
                  type="text"
                  className="w-32 sm:w-40 h-8 text-sm"
                  placeholder="Adjustment"
                  value={adjustmentName ?? ""}
                  onChange={(e) => {
                    form.setValue("strAdjustmentName", e.target.value, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                  }}
                  onBlur={() => setIsEditingAdjustmentName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingAdjustmentName(false);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          onClick={() =>
                            !isFormDisabled && setIsEditingAdjustmentName(true)
                          }
                          className={`border-2 border-dotted border-gray-400 dark:border-gray-500 px-2 py-0.5 rounded ${
                            !isFormDisabled
                              ? "cursor-pointer hover:border-gray-600 dark:hover:border-gray-300"
                              : "cursor-not-allowed opacity-50"
                          } transition-colors`}
                        >
                          {adjustmentName || "Adjustment"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to change adjustment name</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Add any other +ve or -ve charges that need to be
                          applied to adjust the total amount of the transaction.
                          Eg. +10 or -10.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
              {adjustmentAmt !== 0 &&
                adjustmentAmt !== null &&
                adjustmentAmt !== undefined && (
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        !isFormDisabled && setIsAccountDialogOpen(true)
                      }
                      disabled={isFormDisabled}
                      className={`text-xs hover:underline text-left ${
                        selectedAccountName
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-primary font-medium"
                      } ${
                        isFormDisabled
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      {selectedAccountName ? (
                        <span className="flex items-center gap-1">
                          {selectedAccountName}
                          <span className="text-gray-500">(Configure)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          Configure Account
                          <span className="text-red-500">*</span>
                        </span>
                      )}
                    </button>
                    {!selectedAccountName && (
                      <span className="text-[10px] text-red-500 dark:text-red-400">
                        Account selection required
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>
          <div>
            <Input
              type="text"
              inputMode="decimal"
              className="w-24 sm:w-28 md:w-36 h-8 text-sm text-right"
              value={
                adjustmentEditValue ??
                (() => {
                  const amt = form.watch("dblAdjustmentAmt");
                  return amt === null || amt === undefined ? "" : String(amt);
                })()
              }
              onChange={(e) => {
                const v = sanitizeDecimalInput(e.target.value, 3, true);
                setAdjustmentEditValue(v);
                handleAdjustmentChange(v);
              }}
              onFocus={(e) => {
                const amt = form.watch("dblAdjustmentAmt");
                setAdjustmentEditValue(
                  amt === null || amt === undefined ? "" : String(amt)
                );
                e.currentTarget.select();
              }}
              onBlur={() => {
                setAdjustmentEditValue(null);
              }}
              placeholder="0.00"
              disabled={isFormDisabled}
            />
          </div>
        </div>

        <div className="flex justify-between font-bold py-2 px-3 sm:px-4 border-t border-border-color dark:border-gray-700 dark:text-gray-200">
          <div className="text-sm sm:text-base">
            Total{currencyLabel ? ` - ${currencyLabel}` : ""}
          </div>
          <div className="text-right text-sm sm:text-base">
            {canCalculate
              ? formatAmount(
                  // Always derive displayed total from current subtotal + tax + adjustment
                  subtotal + (taxBreakdown.totalTax || 0) + (adjustmentAmt || 0)
                )
              : "-"}
          </div>
        </div>
      </div>

      {/* Configure Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Adjustment Account
              </Label>
              <Select
                value={selectedAccountGUID}
                onValueChange={setSelectedAccountGUID}
                open={isAccountDropdownOpen}
                onOpenChange={setIsAccountDropdownOpen}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Other Charges" />
                </SelectTrigger>
                <SelectContent
                  showSearch
                  searchPlaceholder="Search accounts..."
                >
                  {accountOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAccountDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleAccountUpdate}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
