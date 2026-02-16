import React, { useEffect, useMemo, useRef, useState } from "react";
import type { PurchaseInvoiceItem } from "@/types/Account/purchase-invoice";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { getImagePath } from "@/lib/utils";
import { useActiveByType } from "@/hooks";
import { useItemPurchaseData } from "@/hooks/api/Account/use-items";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataEntryTable,
  type ColumnDefinition,
} from "@/components/data-display/data-tables/DataEntryTable";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useAuthContext } from "@/hooks/common/use-auth-context";

interface ActiveItemData {
  strName?: string;
  strItemGUID?: string;
  dblPrice?: number;
  strImagePath?: string | null;
}

interface ItemOption {
  label: string;
  value: string;
  price: number;
  imagePath: string | null;
}

interface PurchaseInvoiceItemsTableProps {
  items: PurchaseInvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<PurchaseInvoiceItem[]>>;
  disabled?: boolean;
  isDifferentCurrency?: boolean;
  exchangeRate?: number;
}

export const PurchaseInvoiceItemsTable: React.FC<
  PurchaseInvoiceItemsTableProps
> = ({
  items,
  setItems,
  disabled = false,
  isDifferentCurrency,
  exchangeRate,
}) => {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
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
  const round3 = (n: number) => +n.toFixed(3);

  const previousExchangeRateRef = useRef<number | undefined>(exchangeRate);
  const previousCurrencyRef = useRef<boolean | undefined>(isDifferentCurrency);

  const makeKey = (
    rowId: string,
    field: "dblQty" | "dblRate" | "dblDiscountPercentage"
  ) => `${rowId}:${field}`;

  const [pendingSelection, setPendingSelection] = useState<{
    rowId: string;
    itemGUID: string;
  } | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState<string>("");
  const [previewImagePath, setPreviewImagePath] = useState<string | null>(null);

  const { data: itemsData, isLoading: isItemsLoading } = useActiveByType(
    "Purchasable",
    {
      enabled: openRowId !== null,
    }
  );

  const itemOptions = useMemo(() => {
    if (!itemsData || !Array.isArray(itemsData)) return [];
    return itemsData.map((item: ActiveItemData) => ({
      label: item.strName || "",
      value: item.strItemGUID || "",
      price: item.dblPrice ?? 0,
      imagePath: item.strImagePath ?? null,
    }));
  }, [itemsData]);

  const filteredItemOptions = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    if (!term) return itemOptions;
    return itemOptions.filter((option: ItemOption) =>
      option.label.toLowerCase().includes(term)
    );
  }, [itemOptions, itemSearch]);

  const fieldCard =
    "bg-muted/30 dark:bg-card border border-transparent rounded-md hover:border-primary/60 transition-colors shadow-none disabled:border-none disabled:bg-muted/20 dark:disabled:bg-card disabled:cursor-not-allowed";
  const inputCard = `${fieldCard} text-right focus-visible:ring-0 focus-visible:ring-offset-0`;
  const selectTriggerCard = `${fieldCard} h-11 w-full justify-start text-left focus-visible:ring-0 focus-visible:ring-offset-0`;
  const textareaCard = `${fieldCard} min-h-10 resize-y text-sm focus-visible:ring-0 focus-visible:ring-offset-0`;

  const hasInitialized = useRef(false);
  const baseRatesInitializedRef = useRef(false);

  // Ensure net amounts are always numeric (even for legacy/null data) so payload includes dblNetAmt/dblNetAmtBase
  useEffect(() => {
    const fx =
      typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : 1;
    const multiplier = isDifferentCurrency ? fx : 1;

    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        const net = Number.isFinite(it.dblNetAmt as number)
          ? (it.dblNetAmt as number)
          : round3(
              (it.dblTotalAmt ?? 0) + (hasTaxConfig ? (it.dblTaxAmt ?? 0) : 0)
            );

        const netBase = Number.isFinite(it.dblNetAmtBase as number)
          ? (it.dblNetAmtBase as number)
          : round3(net * multiplier);

        if (net !== it.dblNetAmt || netBase !== it.dblNetAmtBase) {
          changed = true;
          return {
            ...it,
            dblNetAmt: net,
            dblNetAmtBase: netBase,
          };
        }

        return it;
      });

      return changed ? next : prev;
    });
  }, [exchangeRate, isDifferentCurrency, hasTaxConfig, setItems]);

  useEffect(() => {
    if (items.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setItems([
        {
          strPurchaseInvoice_ItemGUID: crypto.randomUUID(),
          strPurchaseInvoiceGUID: "",
          intSeqNo: 1,
          strCategoryGUID: null,
          strTaxCategoryName: null,
          strItemGUID: "",
          strItemName: null,
          strUoMGUID: null,
          strUoMName: null,
          strDesc: null,
          dblQty: 0,
          dblRate: 0,
          dblTaxPercentage: null,
          dblTaxAmt: 0,
          dblNetAmt: 0,
          dblTotalAmt: 0,
          strAccountGUID: "",
          strAccountName: null,
          strItemImagePath: null,
          dblDiscountPercentage: 0,
          dblDiscountAmt: 0,
          dblRateBase: null,
          dblTaxAmtBase: null,
          dblNetAmtBase: 0,
          dblTotalAmtBase: null,
          dblDiscountAmtBase: null,
        },
      ]);
    }
  }, [items.length, setItems]);

  // Ensure base rates are captured once for edit mode items lacking dblRateBase
  useEffect(() => {
    if (baseRatesInitializedRef.current) return;
    if (!items.length) return;

    // Only initialize when any item with a selected GUID lacks a base rate
    const needsInit = items.some(
      (it) => it.strItemGUID && (!it.dblRateBase || it.dblRateBase <= 0)
    );
    if (!needsInit) {
      baseRatesInitializedRef.current = true;
      return;
    }

    const fx =
      typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : 1;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (!(it.strItemGUID && (!it.dblRateBase || it.dblRateBase <= 0))) {
          return it;
        }
        const rate = typeof it.dblRate === "number" ? it.dblRate || 0 : 0;
        const base = isDifferentCurrency ? rate * fx : rate;
        changed = true;
        return { ...it, dblRateBase: base };
      });
      // Mark initialized to avoid repeated loops even if values are zero
      baseRatesInitializedRef.current = true;
      return changed ? next : prev;
    });
  }, [items, isDifferentCurrency, exchangeRate, setItems]);

  useEffect(() => {
    const hasItemsWithRates =
      items.length > 0 &&
      items.some((item) => item.strItemGUID && (item.dblRate ?? 0) > 0);

    if (!hasItemsWithRates) {
      previousExchangeRateRef.current = exchangeRate;
      previousCurrencyRef.current = isDifferentCurrency;
      return;
    }

    const currencyChanged = isDifferentCurrency !== previousCurrencyRef.current;
    const exchangeRateChanged =
      exchangeRate !== previousExchangeRateRef.current;

    if (currencyChanged || exchangeRateChanged) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (!item.strItemGUID) return item;

          const oldFx =
            previousExchangeRateRef.current &&
            previousExchangeRateRef.current > 0
              ? previousExchangeRateRef.current
              : 1;
          const newFx =
            typeof exchangeRate === "number" && exchangeRate > 0
              ? exchangeRate
              : 1;

          const baseRateFromState =
            item.dblRateBase !== null && item.dblRateBase !== undefined
              ? item.dblRateBase
              : (item.dblRate || 0) * oldFx;

          const computedBaseRate = baseRateFromState || 0;
          const newRate = isDifferentCurrency
            ? computedBaseRate / newFx
            : computedBaseRate;
          const displayRate = round3(newRate);

          const qty = item.dblQty || 0;
          const discountPct = item.dblDiscountPercentage ?? 0;
          const taxPct = hasTaxConfig ? (item.dblTaxPercentage ?? 0) : 0;

          // baseAmount = rate * qty
          const baseAmount = round3(qty * displayRate);
          // discount BEFORE tax
          const discountAmt = round3((baseAmount * discountPct) / 100);
          const taxableAmount = round3(baseAmount - discountAmt);
          const taxAmt = round3((taxableAmount * taxPct) / 100);
          const finalAmt = round3(taxableAmount + taxAmt);

          const baseMultiplier = isDifferentCurrency ? newFx : 1;
          const baseTaxAmt = round3(taxAmt * baseMultiplier);
          const baseDiscountAmt = round3(discountAmt * baseMultiplier);
          const baseNetAmt = round3(finalAmt * baseMultiplier);
          const baseTotalAmt = round3(taxableAmount * baseMultiplier);

          return {
            ...item,
            dblRate: displayRate,
            dblTaxAmt: taxAmt,
            dblDiscountAmt: discountAmt,
            // taxable amount (post-discount, pre-tax)
            dblTotalAmt: taxableAmount,
            // final amount (taxable + tax)
            dblNetAmt: finalAmt,
            dblRateBase: item.dblRateBase ?? computedBaseRate,
            dblTaxAmtBase: baseTaxAmt,
            dblDiscountAmtBase: baseDiscountAmt,
            dblNetAmtBase: baseNetAmt,
            dblTotalAmtBase: baseTotalAmt,
          };
        })
      );
    }

    previousExchangeRateRef.current = exchangeRate;
    previousCurrencyRef.current = isDifferentCurrency;
  }, [items, isDifferentCurrency, exchangeRate, setItems, hasTaxConfig]);

  const inrFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }),
    []
  );

  const handleItemUpdate = (
    itemId: string,
    field: keyof PurchaseInvoiceItem,
    value: string
  ) => {
    const parseOrZero = (v: string | number | null | undefined): number => {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      const parsed = parseFloat(v ?? "");
      return Number.isFinite(parsed) ? parsed : 0;
    };

    setItems((prevItems): PurchaseInvoiceItem[] =>
      prevItems.map((item): PurchaseInvoiceItem => {
        if (item.strPurchaseInvoice_ItemGUID === itemId) {
          const updatedItem = { ...item };

          const recalcLine = (
            overrides: Partial<
              Pick<
                PurchaseInvoiceItem,
                "dblQty" | "dblRate" | "dblDiscountPercentage"
              >
            >
          ) => {
            const qty = parseOrZero(
              overrides.dblQty !== undefined
                ? overrides.dblQty
                : updatedItem.dblQty
            );
            const rate = parseOrZero(
              overrides.dblRate !== undefined
                ? overrides.dblRate
                : updatedItem.dblRate
            );
            const discountPct = parseOrZero(
              overrides.dblDiscountPercentage !== undefined
                ? overrides.dblDiscountPercentage
                : updatedItem.dblDiscountPercentage
            );
            const taxPct = hasTaxConfig
              ? parseOrZero(updatedItem.dblTaxPercentage)
              : 0;

            // baseAmount = rate * qty
            const baseAmount = round3(qty * rate);
            // discount BEFORE tax
            const discountAmt = round3((baseAmount * discountPct) / 100);
            const taxableAmount = round3(baseAmount - discountAmt);
            const taxAmt = round3((taxableAmount * taxPct) / 100);
            const finalAmt = round3(taxableAmount + taxAmt);

            const fx =
              typeof exchangeRate === "number" && exchangeRate > 0
                ? exchangeRate
                : 1;
            const baseMultiplier = isDifferentCurrency ? fx : 1;

            return {
              dblDiscountAmt: discountAmt,
              dblTaxAmt: taxAmt,
              dblTotalAmt: taxableAmount,
              dblNetAmt: finalAmt,
              dblRateBase: round3(rate * baseMultiplier),
              dblTaxAmtBase: round3(taxAmt * baseMultiplier),
              dblDiscountAmtBase: round3(discountAmt * baseMultiplier),
              dblNetAmtBase: round3(finalAmt * baseMultiplier),
              dblTotalAmtBase: round3(taxableAmount * baseMultiplier),
            } as Pick<
              PurchaseInvoiceItem,
              | "dblDiscountAmt"
              | "dblTaxAmt"
              | "dblTotalAmt"
              | "dblNetAmt"
              | "dblRateBase"
              | "dblTaxAmtBase"
              | "dblDiscountAmtBase"
              | "dblNetAmtBase"
              | "dblTotalAmtBase"
            >;
          };

          if (field === "dblQty" || field === "dblRate") {
            const qty =
              field === "dblQty"
                ? parseOrZero(value)
                : parseOrZero(item.dblQty);
            const rate =
              field === "dblRate"
                ? parseOrZero(value)
                : parseOrZero(item.dblRate);
            const recalculated = recalcLine({
              dblQty: qty,
              dblRate: rate,
            });
            return {
              ...updatedItem,
              [field]: field === "dblQty" ? qty : rate,
              ...recalculated,
            };
          }

          if (field === "dblDiscountPercentage") {
            const discountPercentage = parseOrZero(value);
            const recalculated = recalcLine({
              dblDiscountPercentage: discountPercentage,
            });
            return {
              ...updatedItem,
              dblDiscountPercentage: discountPercentage,
              ...recalculated,
            };
          }

          if (field === "strItemGUID") {
            return {
              ...updatedItem,
              strItemGUID: value,
            };
          }

          return {
            ...updatedItem,
            [field]: value,
          };
        }
        return item;
      })
    );
  };

  const handleItemSelect = (itemId: string, itemGUID: string) => {
    if (disabled) return;

    setOpenRowId(null);
    setPendingSelection({ rowId: itemId, itemGUID });
  };

  const { data: selectedItemPurchaseData } = useItemPurchaseData(
    pendingSelection?.itemGUID
  );

  useEffect(() => {
    if (!pendingSelection || !selectedItemPurchaseData) return;

    const selectedOption = itemOptions.find(
      (opt: ItemOption) => opt.value === pendingSelection.itemGUID
    );
    const imagePath = selectedOption?.imagePath ?? null;

    setItems((prevItems): PurchaseInvoiceItem[] =>
      prevItems.map((item): PurchaseInvoiceItem => {
        if (item.strPurchaseInvoice_ItemGUID !== pendingSelection.rowId)
          return item;

        const baseRate = selectedItemPurchaseData.dblCostPrice ?? 0;
        const fx =
          typeof exchangeRate === "number" && exchangeRate > 0
            ? exchangeRate
            : 1;
        const rate = round3(isDifferentCurrency ? baseRate / fx : baseRate);
        const qty = item.dblQty && item.dblQty > 0 ? item.dblQty : 1;
        const discountPct = item.dblDiscountPercentage ?? 0;
        const taxPct = hasTaxConfig
          ? (selectedItemPurchaseData.decTaxPercentage ?? 0)
          : 0;

        // baseAmount = rate * qty
        const baseAmount = round3(qty * rate);
        const discountAmt = round3((baseAmount * discountPct) / 100);
        const taxableAmount = round3(baseAmount - discountAmt);
        const taxAmt = round3((taxableAmount * taxPct) / 100);
        const finalAmt = round3(taxableAmount + taxAmt);

        const baseAmountBase = round3(qty * baseRate);
        const baseDiscountAmt = round3((baseAmountBase * discountPct) / 100);
        const taxableAmountBase = round3(baseAmountBase - baseDiscountAmt);
        const baseTaxAmt = round3((taxableAmountBase * taxPct) / 100);
        const baseNetAmt = round3(taxableAmountBase + baseTaxAmt);
        const baseTotalAmt = taxableAmountBase;

        return {
          ...item,
          strItemGUID: pendingSelection.itemGUID,
          strItemName: selectedItemPurchaseData.strName || null,
          strDesc:
            selectedItemPurchaseData.strPurchaseDescription ??
            item.strDesc ??
            null,
          strCategoryGUID: selectedItemPurchaseData.strTaxCategoryGUID || null,
          strTaxCategoryName:
            selectedItemPurchaseData.strTaxCategoryName || null,
          strUoMGUID: selectedItemPurchaseData.strUnitGUID || null,
          strUoMName: selectedItemPurchaseData.strUnitName || null,
          strAccountGUID: selectedItemPurchaseData.strPurchaseAccountGUID || "",
          strItemImagePath: imagePath,
          dblRate: rate,
          dblQty: qty,
          dblDiscountAmt: discountAmt,
          dblTotalAmt: taxableAmount,
          dblNetAmt: finalAmt,
          dblTaxPercentage: taxPct,
          dblTaxAmt: taxAmt,
          dblRateBase: baseRate,
          dblTaxAmtBase: baseTaxAmt,
          dblDiscountAmtBase: baseDiscountAmt,
          dblNetAmtBase: baseNetAmt,
          dblTotalAmtBase: baseTotalAmt,
        };
      })
    );

    setPendingSelection(null);
  }, [
    itemOptions,
    pendingSelection,
    selectedItemPurchaseData,
    setItems,
    isDifferentCurrency,
    exchangeRate,
    hasTaxConfig,
  ]);

  const handleDeleteItem = (itemId: string | null, index: number) => {
    if (disabled) return;

    setItems((prevItems) =>
      prevItems.filter((item, i) => {
        if (itemId) {
          return item.strPurchaseInvoice_ItemGUID !== itemId;
        }
        return i !== index;
      })
    );
  };

  const handleAddItem = () => {
    if (disabled) return;

    setItems((prevItems) => [
      ...prevItems,
      {
        strPurchaseInvoice_ItemGUID: crypto.randomUUID(),
        strPurchaseInvoiceGUID: "",
        intSeqNo: prevItems.length + 1,
        strCategoryGUID: null,
        strTaxCategoryName: null,
        strItemGUID: "",
        strItemName: null,
        strUoMGUID: null,
        strUoMName: null,
        strDesc: null,
        dblQty: 0,
        dblRate: 0,
        dblTaxPercentage: null,
        dblTaxAmt: 0,
        dblNetAmt: 0,
        dblTotalAmt: 0,
        strAccountGUID: "",
        strAccountName: null,
        strItemImagePath: null,
        dblDiscountPercentage: 0,
        dblDiscountAmt: 0,
        dblRateBase: null,
        dblTaxAmtBase: null,
        dblNetAmtBase: 0,
        dblTotalAmtBase: null,
        dblDiscountAmtBase: null,
      },
    ]);
  };

  const columns: ColumnDefinition<PurchaseInvoiceItem>[] = [
    {
      key: "itemDetails",
      label: "Item Details",
      width: "w-[40%]",
      align: "left",
      render: (item, _index, onUpdate) => {
        void _index;
        const rowId = item.strPurchaseInvoice_ItemGUID!;
        const selectedOption = itemOptions.find(
          (option: ItemOption) => option.value === item.strItemGUID
        );
        const displayImagePath =
          item.strItemImagePath ?? selectedOption?.imagePath ?? null;

        return (
          <div className="flex items-start gap-3">
            <button
              type="button"
              className={`h-11 w-11 rounded-md flex items-center justify-center overflow-hidden shrink-0 border ${
                displayImagePath
                  ? "border-none"
                  : "border-dashed border-border bg-muted/30"
              } ${displayImagePath ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (displayImagePath) setPreviewImagePath(displayImagePath);
              }}
              disabled={!displayImagePath}
              aria-label={displayImagePath ? "Preview item image" : "No image"}
            >
              {displayImagePath ? (
                <img
                  src={getImagePath(displayImagePath)}
                  alt={item.strItemName || "Item"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">Image</span>
              )}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <Select
                value={item.strItemGUID || ""}
                open={openRowId === rowId}
                onOpenChange={(isOpen) => {
                  setOpenRowId(isOpen ? rowId : null);
                  if (!isOpen) setItemSearch("");
                }}
                onValueChange={(value) => {
                  handleItemSelect(rowId, value);
                }}
                disabled={disabled}
              >
                <SelectTrigger className={selectTriggerCard}>
                  <SelectValue placeholder="Click to select an item.">
                    {item.strItemName ||
                      selectedOption?.label ||
                      "Type or click to select an item."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="p-0 text-sm overflow-hidden">
                  <div className="mx-2 mb-2 sticky top-0 z-1000 bg-card">
                    <Input
                      autoFocus
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      placeholder="Search items..."
                    />
                  </div>

                  {isItemsLoading ? (
                    <div className="space-y-2 px-2 py-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : filteredItemOptions.length === 0 ? (
                    <div className="px-1 py-2 text-xs text-muted-foreground">
                      No items found
                    </div>
                  ) : (
                    filteredItemOptions.map((option: ItemOption) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="py-2 text-left"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Rate: {inrFormatter.format(option.price || 0)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {item.strItemGUID ? (
                <Textarea
                  value={item.strDesc ?? ""}
                  onChange={(e) => onUpdate("strDesc", e.target.value)}
                  placeholder="Add a description to your item"
                  className={textareaCard}
                  rows={2}
                  disabled={disabled}
                />
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      key: "qty",
      label: "Qty",
      width: "w-[12%]",
      align: "right",
      render: (item, _index, onUpdate) => {
        void _index;
        const key = makeKey(item.strPurchaseInvoice_ItemGUID!, "dblQty");
        return (
          <div className="flex flex-col items-end gap-1">
            <Input
              type="text"
              inputMode="decimal"
              value={
                editValues[key] ??
                (item.dblQty === null || item.dblQty === undefined
                  ? ""
                  : String(item.dblQty))
              }
              onChange={(e) => {
                const v = sanitizeDecimalInput(e.target.value);
                setEditValues((prev) => ({ ...prev, [key]: v }));
                onUpdate("dblQty", v);
              }}
              onFocus={(e) => {
                setEditValues((prev) => ({
                  ...prev,
                  [key]:
                    prev[key] ??
                    (item.dblQty === null || item.dblQty === undefined
                      ? ""
                      : String(item.dblQty)),
                }));
                e.currentTarget.select();
              }}
              onBlur={() => {
                setEditValues((prev) => {
                  const next = { ...prev };
                  delete next[key];
                  return next;
                });
              }}
              placeholder="0.000"
              className={inputCard}
              disabled={disabled}
            />
            <span className="text-[11px] text-muted-foreground pr-2">
              {item.strUoMName || ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "rate",
      label: "Rate",
      width: "w-[12%]",
      align: "right",
      render: (item, _index, onUpdate) => {
        void _index;
        const key = makeKey(item.strPurchaseInvoice_ItemGUID!, "dblRate");
        return (
          <Input
            type="text"
            inputMode="decimal"
            value={
              editValues[key] ??
              (item.dblRate === null || item.dblRate === undefined
                ? ""
                : String(item.dblRate))
            }
            onChange={(e) => {
              const v = sanitizeDecimalInput(e.target.value);
              setEditValues((prev) => ({ ...prev, [key]: v }));
              onUpdate("dblRate", v);
            }}
            onFocus={(e) => {
              setEditValues((prev) => ({
                ...prev,
                [key]:
                  prev[key] ??
                  (item.dblRate === null || item.dblRate === undefined
                    ? ""
                    : String(item.dblRate)),
              }));
              e.currentTarget.select();
            }}
            onBlur={() => {
              setEditValues((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }}
            placeholder="0.000"
            className={inputCard}
            disabled={disabled}
          />
        );
      },
    },
    {
      key: "discountPercentage",
      label: "Discount %",
      width: "w-[16%]",
      align: "right",
      render: (item, _index, onUpdate) => {
        void _index;
        const key = makeKey(
          item.strPurchaseInvoice_ItemGUID!,
          "dblDiscountPercentage"
        );
        const fallbackValue =
          item.dblDiscountPercentage === null ||
          item.dblDiscountPercentage === undefined
            ? ""
            : String(item.dblDiscountPercentage);
        return (
          <Input
            type="text"
            inputMode="decimal"
            value={editValues[key] ?? fallbackValue}
            onChange={(e) => {
              const v = sanitizeDecimalInput(e.target.value);
              setEditValues((prev) => ({ ...prev, [key]: v }));
              onUpdate("dblDiscountPercentage", v);
            }}
            onFocus={(e) => {
              setEditValues((prev) => ({
                ...prev,
                [key]: prev[key] ?? fallbackValue,
              }));
              e.currentTarget.select();
            }}
            onBlur={() => {
              setEditValues((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
              });
            }}
            placeholder="0.000"
            className={inputCard}
            disabled={disabled}
          />
        );
      },
    },
    // Conditionally show tax column only when tax config exists
    ...(hasTaxConfig
      ? ([
          {
            key: "taxPercentage",
            label: "Tax %",
            width: "w-[10%]",
            align: "right",
            render: (item) => (
              <div className="flex flex-col items-end gap-1">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={item.dblTaxPercentage || 0}
                  readOnly
                  placeholder="0.000"
                  className={`${inputCard} hover:border-transparent`}
                  disabled={disabled}
                />
                <span className="text-[11px] text-muted-foreground pr-2">
                  {item.strTaxCategoryName || ""}
                </span>
              </div>
            ),
          },
        ] as ColumnDefinition<PurchaseInvoiceItem>[])
      : []),
    {
      key: "amount",
      label: "Amount",
      width: "w-[12%]",
      align: "right",
      render: (item) => (
        <Input
          type="text"
          inputMode="decimal"
          value={item.dblNetAmt || 0}
          readOnly
          placeholder="0.000"
          className={`${inputCard} font-medium hover:border-transparent`}
          disabled={disabled}
        />
      ),
    },
  ];

  return (
    <>
      <DataEntryTable
        items={items}
        columns={columns}
        onItemUpdate={handleItemUpdate}
        onDeleteItem={handleDeleteItem}
        onAddItem={handleAddItem}
        getItemId={(item) => item.strPurchaseInvoice_ItemGUID || ""}
        getItemKey={(item, index) =>
          item.strPurchaseInvoice_ItemGUID || `purchase-invoice-item-${index}`
        }
        disabled={disabled}
      />

      <Dialog
        open={Boolean(previewImagePath)}
        onOpenChange={(open) => {
          if (!open) setPreviewImagePath(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl w-[92vw] sm:w-auto">
          <DialogClose
            className="fixed top-4 right-4 z-60 rounded-full p-2 bg-background/80 backdrop-blur-sm border border-border hover:bg-muted text-muted-foreground hover:text-foreground shadow"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </DialogClose>
          {previewImagePath ? (
            <img
              src={getImagePath(previewImagePath)}
              alt="Item preview"
              className="w-full max-h-[85vh] object-contain rounded-md"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
