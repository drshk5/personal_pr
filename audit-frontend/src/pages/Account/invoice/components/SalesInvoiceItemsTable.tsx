import React, { useEffect, useMemo, useRef, useState } from "react";

import type { InvoiceItem } from "@/types/Account/salesinvoice";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { getImagePath } from "@/lib/utils";

import { useActiveByType } from "@/hooks";
import { useItemSalesData } from "@/hooks/api/Account/use-items";
import { useAuthContext } from "@/hooks/common/use-auth-context";

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

interface InvoiceItemsTableProps {
  items: InvoiceItem[];
  setItems: React.Dispatch<React.SetStateAction<InvoiceItem[]>>;
  disabled?: boolean;
  isDifferentCurrency?: boolean;
  exchangeRate?: number; // To convert base (user currency) -> selected currency
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
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
    "Sellable",
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
      imagePath: item.strImagePath || null,
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

  useEffect(() => {
    if (items.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setItems([
        {
          strInvoice_ItemGUID: crypto.randomUUID(),
          strInvoiceGUID: "",
          intSeqNo: 1,
          strCategoryGUID: null,
          strItemGUID: "",
          strItemName: null,
          strUoMGUID: null,
          strUoMName: null,
          strDesc: null,
          dblQty: 0,
          dblRate: 0,
          dblTaxPercentage: null,
          dblTaxAmt: 0,
          dblTotalAmt: 0,
          dblNetAmt: 0,
          strAccountGUID: "",
          strAccountName: null,
          dblDiscountPercentage: null,
          dblDiscountAmt: 0,
          dblRateBase: null,
          dblTaxAmtBase: null,
          dblTotalAmtBase: null,
          dblNetAmtBase: null,
          dblDiscountAmtBase: null,
          strTaxCategoryName: null,
          strItemImagePath: null,
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

  // Detect currency changes and update item rates
  useEffect(() => {
    // Only proceed if we have items with rates or existing amounts (from loaded invoices)
    const hasItemsWithRates =
      items.length > 0 &&
      items.some(
        (item) =>
          item.strItemGUID &&
          ((item.dblRate ?? 0) > 0 || (item.dblTotalAmt ?? 0) > 0)
      );

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

          // When same currency, use base rate; when different currency, convert from base rate
          let computedRate: number;
          if (isDifferentCurrency) {
            // Different currency: convert from base rate using exchange rate
            const baseRateFromState =
              item.dblRateBase !== null &&
              item.dblRateBase !== undefined &&
              item.dblRateBase > 0
                ? item.dblRateBase
                : (item.dblRate || 0) * oldFx;
            computedRate = baseRateFromState / newFx;
          } else {
            // Same currency: use the base rate directly (original rate)
            computedRate =
              item.dblRateBase !== null &&
              item.dblRateBase !== undefined &&
              item.dblRateBase > 0
                ? item.dblRateBase
                : item.dblRate || 0;
          }
          const computedRateRounded = round3(computedRate);

          const qty = item.dblQty || 0;
          const discountPct = item.dblDiscountPercentage ?? 0;
          const taxPct = hasTaxConfig ? (item.dblTaxPercentage ?? 0) : 0;

          // baseAmount = rate * qty
          const baseAmount = round3(qty * computedRateRounded);
          // discount BEFORE tax
          const discountAmt = round3((baseAmount * discountPct) / 100);
          const taxableAmount = round3(baseAmount - discountAmt);
          const taxAmt = round3((taxableAmount * taxPct) / 100);
          const finalAmt = round3(taxableAmount + taxAmt);

          const baseMultiplier = isDifferentCurrency ? newFx : 1;
          const discountAmtBase = round3(discountAmt * baseMultiplier);
          const taxableAmountBase = round3(taxableAmount * baseMultiplier);
          const taxAmtBase = round3(taxAmt * baseMultiplier);
          const finalAmtBase = round3(finalAmt * baseMultiplier);

          return {
            ...item,
            dblRate: computedRateRounded,
            dblTaxAmt: taxAmt,
            dblDiscountAmt: discountAmt,
            // Store taxable amount (post-discount, pre-tax) in dblTotalAmt
            dblTotalAmt: taxableAmount,
            // Store final amount (taxable + tax) in dblNetAmt
            dblNetAmt: finalAmt,
            dblRateBase: isDifferentCurrency
              ? (item.dblRateBase ?? computedRate * newFx)
              : computedRate,
            dblTaxAmtBase: taxAmtBase,
            dblDiscountAmtBase: discountAmtBase,
            dblTotalAmtBase: taxableAmountBase,
            dblNetAmtBase: finalAmtBase,
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
    field: keyof InvoiceItem,
    value: string
  ) => {
    const parseOrZero = (v: string | number | null | undefined): number => {
      if (typeof v === "number") return Number.isFinite(v) ? v : 0;
      const parsed = parseFloat(v ?? "");
      return Number.isFinite(parsed) ? parsed : 0;
    };

    setItems((prevItems): InvoiceItem[] =>
      prevItems.map((item): InvoiceItem => {
        if (item.strInvoice_ItemGUID === itemId) {
          const updatedItem = { ...item };

          const recalcLine = (
            overrides: Partial<
              Pick<InvoiceItem, "dblQty" | "dblRate" | "dblDiscountPercentage">
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
              dblTotalAmtBase: round3(taxableAmount * baseMultiplier),
              dblNetAmtBase: round3(finalAmt * baseMultiplier),
            } as Pick<
              InvoiceItem,
              | "dblDiscountAmt"
              | "dblTaxAmt"
              | "dblTotalAmt"
              | "dblNetAmt"
              | "dblRateBase"
              | "dblTaxAmtBase"
              | "dblDiscountAmtBase"
              | "dblTotalAmtBase"
              | "dblNetAmtBase"
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
            // Just set the GUID - full item data will be populated by useItemSalesData
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

  // Sales data is fetched only when the user selects/changes an item
  const { data: selectedItemSalesData } = useItemSalesData(
    pendingSelection?.itemGUID
  );

  useEffect(() => {
    if (!pendingSelection || !selectedItemSalesData) return;

    const selectedOption = itemOptions.find(
      (opt: ItemOption) => opt.value === pendingSelection.itemGUID
    );
    const imagePath = selectedOption?.imagePath ?? null;

    setItems((prevItems): InvoiceItem[] =>
      prevItems.map((item): InvoiceItem => {
        if (item.strInvoice_ItemGUID !== pendingSelection.rowId) return item;

        const baseRate = selectedItemSalesData.dblSellingPrice ?? 0;
        const fx =
          typeof exchangeRate === "number" && exchangeRate > 0
            ? exchangeRate
            : 1;
        const rate = round3(isDifferentCurrency ? baseRate / fx : baseRate);
        const qty = item.dblQty && item.dblQty > 0 ? item.dblQty : 1;
        const discountPct = item.dblDiscountPercentage ?? 0;
        const taxPct = hasTaxConfig
          ? (selectedItemSalesData.decTaxPercentage ?? 0)
          : 0;

        // baseAmount = rate * qty
        const baseAmount = round3(qty * rate);
        // discount BEFORE tax
        const discountAmt = round3((baseAmount * discountPct) / 100);
        const taxableAmount = round3(baseAmount - discountAmt);
        const taxAmt = round3((taxableAmount * taxPct) / 100);
        const finalAmt = round3(taxableAmount + taxAmt);

        const baseAmountBase = round3(qty * baseRate);
        const discountAmtBase = round3((baseAmountBase * discountPct) / 100);
        const taxableAmountBase = round3(baseAmountBase - discountAmtBase);
        const taxAmtBase = round3((taxableAmountBase * taxPct) / 100);
        const finalAmtBase = round3(taxableAmountBase + taxAmtBase);

        return {
          ...item,
          strItemGUID: pendingSelection.itemGUID,
          strItemName: selectedItemSalesData.strName || null,
          strDesc:
            selectedItemSalesData.strSalesDescription ?? item.strDesc ?? null,
          strCategoryGUID: selectedItemSalesData.strTaxCategoryGUID || null,
          strTaxCategoryName: selectedItemSalesData.strTaxCategoryName || null,
          strUoMGUID: selectedItemSalesData.strUnitGUID || null,
          strUoMName: selectedItemSalesData.strUnitName || null,
          strAccountGUID: selectedItemSalesData.strSalesAccountGUID || "",
          dblRate: rate,
          dblQty: qty,
          dblDiscountAmt: discountAmt,
          dblTotalAmt: taxableAmount,
          dblNetAmt: finalAmt,
          dblTaxPercentage: taxPct,
          dblTaxAmt: taxAmt,
          dblRateBase: baseRate,
          dblTaxAmtBase: taxAmtBase,
          dblDiscountAmtBase: discountAmtBase,
          dblTotalAmtBase: taxableAmountBase,
          dblNetAmtBase: finalAmtBase,
          strItemImagePath: imagePath,
        };
      })
    );

    // Do not derive images from sales data; rely on active items list.
    // Row images are populated by the items/itemOptions effect when items change.

    setPendingSelection(null);
  }, [
    itemOptions,
    pendingSelection,
    selectedItemSalesData,
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
          return item.strInvoice_ItemGUID !== itemId;
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
        strInvoice_ItemGUID: crypto.randomUUID(),
        strInvoiceGUID: "",
        intSeqNo: prevItems.length + 1,
        strCategoryGUID: null,
        strItemGUID: "",
        strItemName: null,
        strUoMGUID: null,
        strUoMName: null,
        strDesc: null,
        dblQty: 0,
        dblRate: 0,
        dblTaxPercentage: null,
        dblTaxAmt: 0,
        dblTotalAmt: 0,
        dblNetAmt: 0,
        strAccountGUID: "",
        strAccountName: null,
        dblDiscountPercentage: null,
        dblDiscountAmt: 0,
        dblRateBase: null,
        dblTaxAmtBase: null,
        dblTotalAmtBase: null,
        dblNetAmtBase: null,
        dblDiscountAmtBase: null,
        strTaxCategoryName: null,
        strItemImagePath: null,
      },
    ]);
  };

  const columns: ColumnDefinition<InvoiceItem>[] = [
    {
      key: "itemDetails",
      label: "Item Details",
      width: "w-[40%]",
      align: "left",
      render: (item, _index, onUpdate) => {
        void _index;
        const rowId = item.strInvoice_ItemGUID!;
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
        const key = makeKey(item.strInvoice_ItemGUID!, "dblQty");
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
        const key = makeKey(item.strInvoice_ItemGUID!, "dblRate");
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
        const key = makeKey(item.strInvoice_ItemGUID!, "dblDiscountPercentage");
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
        ] as ColumnDefinition<InvoiceItem>[])
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
        getItemId={(item) => item.strInvoice_ItemGUID || ""}
        getItemKey={(item, index) =>
          item.strInvoice_ItemGUID || `invoice-item-${index}`
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
