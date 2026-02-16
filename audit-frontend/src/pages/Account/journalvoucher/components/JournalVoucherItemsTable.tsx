import React from "react";
import { useAccountsByTypesTree } from "@/hooks/api/Account";
import type { ScheduleTreeNode } from "@/types/Account/account";
import type { JournalVoucherItem } from "@/types/Account/journal-voucher";
import { sanitizeDecimalInput } from "@/lib/utils/formatting";
import { BANK_ACCOUNT_TYPE_GUID } from "@/constants/Account/account";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DataEntryTable,
  type ColumnDefinition,
} from "@/components/data-display/data-tables/DataEntryTable";
import type { JournalVoucherTemplateItemUpsert } from "@/types/Account/journal-voucher-template-item";

// Helper type for items that can be either voucher or template items
type JournalItem =
  | JournalVoucherItem
  | (JournalVoucherTemplateItemUpsert & {
      strJournal_Voucher_Template_ItemGUID?: string;
    });

// Helper function to get item ID
const getItemId = (item: JournalItem): string | null => {
  if (
    "strJournal_Voucher_ItemGUID" in item &&
    item.strJournal_Voucher_ItemGUID
  ) {
    return item.strJournal_Voucher_ItemGUID;
  }
  if (
    "strJournal_Voucher_Template_ItemGUID" in item &&
    item.strJournal_Voucher_Template_ItemGUID
  ) {
    return item.strJournal_Voucher_Template_ItemGUID;
  }
  return null;
};

// Helper function to check if item is a template item
const isTemplateItem = (
  item: JournalItem
): item is JournalVoucherTemplateItemUpsert & {
  strJournal_Voucher_Template_ItemGUID?: string;
} => {
  return (
    "strJournal_Voucher_Template_ItemGUID" in item ||
    (!("strJournal_Voucher_ItemGUID" in item) && "strCurrencyTypeGUID" in item)
  );
};

interface JournalVoucherItemsTableProps {
  items: JournalVoucherItem[];
  setItems: (items: JournalVoucherItem[]) => void;
  disabled?: boolean;
  onItemDeleted?: (itemGuid: string) => void;
}

export const JournalVoucherItemsTable: React.FC<
  JournalVoucherItemsTableProps
> = ({ items, setItems, disabled = false, onItemDeleted }) => {
  const [editValues, setEditValues] = React.useState<Record<string, string>>(
    {}
  );
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] =
    React.useState(false);

  const makeKey = (rowId: string, field: "dblDebit" | "dblCredit") =>
    `${rowId}:${field}`;
  // Fetch accounts excluding Bank account type
  const { data: accountsTreeData, isLoading: isLoadingAccounts } =
    useAccountsByTypesTree(
      {
        strAccountTypeGUIDs: BANK_ACCOUNT_TYPE_GUID,
        maxLevel: 0, // Get all levels
      },
      { enabled: isAccountDropdownOpen }
    );

  const fieldCard =
    "bg-muted/30 dark:bg-card border border-transparent rounded-md hover:border-primary/60 transition-colors shadow-none";
  const selectTriggerCard = `${fieldCard} h-11 w-full justify-start text-left focus-visible:ring-0 focus-visible:ring-offset-0`;
  const textareaCard = `${fieldCard} min-h-10 resize-y text-sm focus-visible:ring-0 focus-visible:ring-offset-0`;

  const { accountLookup, treeSelectItems } = React.useMemo(() => {
    if (!accountsTreeData?.scheduleTree) {
      return { accountLookup: new Map(), treeSelectItems: [] };
    }

    const lookup = new Map<string, string>();
    const items: React.ReactNode[] = [];

    const renderScheduleTree = (
      nodes: ScheduleTreeNode[],
      depth: number = 0
    ): void => {
      nodes.forEach((node) => {
        // Add schedule header as disabled option if it has accounts or children
        if (node.accounts.length > 0 || node.children.length > 0) {
          const indent = "\u00A0\u00A0".repeat(depth * 2);
          items.push(
            <SelectItem
              key={`schedule-${node.strScheduleGUID}`}
              value={`schedule-${node.strScheduleGUID}`}
              disabled
              className="font-semibold text-muted-foreground"
            >
              {indent}
              {node.strScheduleName} ({node.strScheduleCode})
            </SelectItem>
          );
        }

        node.accounts.forEach((account) => {
          lookup.set(account.strAccountGUID, account.strAccountName);
          const indent = "\u00A0\u00A0".repeat((depth + 1) * 2);
          items.push(
            <SelectItem
              key={account.strAccountGUID}
              value={account.strAccountGUID}
            >
              {indent}• {account.strAccountName}
            </SelectItem>
          );
        });

        if (node.children.length > 0) {
          renderScheduleTree(node.children, depth + 1);
        }
      });
    };

    renderScheduleTree(accountsTreeData.scheduleTree);

    return { accountLookup: lookup, treeSelectItems: items };
  }, [accountsTreeData]);

  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (items.length === 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      setItems([
        {
          intSeqNo: 1,
          strJournal_Voucher_ItemGUID: null,
          strAccountGUID: "",
          strDesc: null,
          dblDebit: null,
          dblCredit: null,
        } as JournalVoucherItem,
        {
          intSeqNo: 2,
          strJournal_Voucher_ItemGUID: null,
          strAccountGUID: "",
          strDesc: null,
          dblDebit: null,
          dblCredit: null,
        } as JournalVoucherItem,
      ]);
    }
  }, [items.length, setItems]);

  const handleItemUpdate = (
    itemId: string,
    field: keyof JournalVoucherItem,
    value: string
  ) => {
    setItems(
      items.map((item) => {
        const currentItemId =
          getItemId(item as JournalItem) || `temp-${item.intSeqNo}`;
        if (currentItemId === itemId) {
          const updatedItem = { ...item };

          if (field === "dblDebit" || field === "dblCredit") {
            const numericValue = parseFloat(value) || 0;
            const roundedValue = Math.round(numericValue * 1000) / 1000;

            if (field === "dblDebit") {
              return {
                ...updatedItem,
                dblDebit: roundedValue,
                dblCredit: numericValue > 0 ? 0 : updatedItem.dblCredit,
              };
            }

            if (field === "dblCredit") {
              return {
                ...updatedItem,
                dblDebit: roundedValue > 0 ? 0 : updatedItem.dblDebit,
                dblCredit: roundedValue,
              };
            }
          }

          if (field === "strAccountGUID") {
            return {
              ...updatedItem,
              strAccountGUID: value,
            };
          }

          if (field === "strDesc") {
            return {
              ...updatedItem,
              strDesc: value || null,
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

  const handleDeleteItem = (itemId: string | null, index: number) => {
    if (disabled) return;

    const itemToDelete = items[index];
    if (
      itemToDelete &&
      onItemDeleted &&
      "strJournal_Voucher_ItemGUID" in itemToDelete &&
      itemToDelete.strJournal_Voucher_ItemGUID
    ) {
      onItemDeleted(itemToDelete.strJournal_Voucher_ItemGUID);
    }

    setItems(
      items.filter((item, i) => {
        if (itemId) {
          const currentItemId =
            getItemId(item as JournalItem) || `temp-${item.intSeqNo}`;
          return currentItemId !== itemId;
        }
        return i !== index;
      })
    );
  };

  const handleAddItem = () => {
    if (disabled) return;

    const baseItem = {
      intSeqNo: items.length + 1,
      strAccountGUID: "",
      strDesc: null,
      dblDebit: null,
      dblCredit: null,
    };

    const firstItem = items[0] as JournalItem;
    if (firstItem && isTemplateItem(firstItem)) {
      const newItem = {
        ...baseItem,
        strJournal_Voucher_Template_ItemGUID: crypto.randomUUID(),
        strRefNo: null,
        strNotes: null,
        strCurrencyTypeGUID: "",
      };
      setItems([...items, newItem as unknown as JournalVoucherItem]);
    } else {
      const newItem = {
        ...baseItem,
        strJournal_Voucher_ItemGUID: null,
      };
      setItems([...items, newItem as unknown as JournalVoucherItem]);
    }
  };

  const columns: ColumnDefinition<JournalVoucherItem>[] = [
    {
      key: "account",
      label: "Account",
      width: "w-[20%]",
      align: "left",
      render: (item, _, onUpdate) => (
        <Select
          value={item.strAccountGUID || ""}
          onValueChange={(value) => onUpdate("strAccountGUID", value)}
          onOpenChange={setIsAccountDropdownOpen}
          disabled={disabled || isLoadingAccounts}
        >
          <SelectTrigger className={selectTriggerCard}>
            <SelectValue placeholder="Select Account">
              {item.strAccountGUID
                ? accountLookup.get(item.strAccountGUID) || "Unknown Account"
                : "Select Account"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-75">
            {isLoadingAccounts ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Loading accounts...
              </div>
            ) : treeSelectItems.length > 0 ? (
              treeSelectItems
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No accounts available
              </div>
            )}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "description",
      label: "Description",
      width: "w-[25%]",
      align: "left",
      render: (item, _, onUpdate) => (
        <Textarea
          value={item.strDesc || ""}
          onChange={(e) => onUpdate("strDesc", e.target.value)}
          placeholder="Description"
          className={`${textareaCard} py-2`}
          rows={1}
          disabled={disabled}
        />
      ),
    },
    {
      key: "debit",
      label: "Debit",
      width: "w-[13%]",
      align: "right",
      render: (item, _, onUpdate) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={
                    editValues[
                      makeKey(
                        getItemId(item as JournalItem) ||
                          `temp-${item.intSeqNo}`,
                        "dblDebit"
                      )
                    ] ??
                    (item.dblDebit === null ||
                    item.dblDebit === undefined ||
                    item.dblDebit === 0
                      ? ""
                      : String(item.dblDebit))
                  }
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblDebit"
                    );
                    setEditValues((prev) => ({ ...prev, [key]: v }));
                    onUpdate("dblDebit", v);
                  }}
                  onFocus={(e) => {
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblDebit"
                    );
                    setEditValues((prev) => ({
                      ...prev,
                      [key]:
                        prev[key] ??
                        (item.dblDebit === null ||
                        item.dblDebit === undefined ||
                        item.dblDebit === 0
                          ? ""
                          : String(item.dblDebit)),
                    }));
                    e.currentTarget.select();
                  }}
                  onBlur={() => {
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblDebit"
                    );
                    setEditValues((prev) => {
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                  }}
                  className="text-right"
                  placeholder="0.000"
                  disabled={disabled || !item.strAccountGUID}
                />
              </div>
            </TooltipTrigger>
            {!item.strAccountGUID && (
              <TooltipContent>
                <p>Please select an account first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      key: "credit",
      label: "Credit",
      width: "w-[13%]",
      align: "right",
      render: (item, _, onUpdate) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={
                    editValues[
                      makeKey(
                        getItemId(item as JournalItem) ||
                          `temp-${item.intSeqNo}`,
                        "dblCredit"
                      )
                    ] ??
                    (item.dblCredit === null ||
                    item.dblCredit === undefined ||
                    item.dblCredit === 0
                      ? ""
                      : String(item.dblCredit))
                  }
                  onChange={(e) => {
                    const v = sanitizeDecimalInput(e.target.value);
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblCredit"
                    );
                    setEditValues((prev) => ({ ...prev, [key]: v }));
                    onUpdate("dblCredit", v);
                  }}
                  onFocus={(e) => {
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblCredit"
                    );
                    setEditValues((prev) => ({
                      ...prev,
                      [key]:
                        prev[key] ??
                        (item.dblCredit === null ||
                        item.dblCredit === undefined ||
                        item.dblCredit === 0
                          ? ""
                          : String(item.dblCredit)),
                    }));
                    e.currentTarget.select();
                  }}
                  onBlur={() => {
                    const key = makeKey(
                      getItemId(item as JournalItem) || `temp-${item.intSeqNo}`,
                      "dblCredit"
                    );
                    setEditValues((prev) => {
                      const next = { ...prev };
                      delete next[key];
                      return next;
                    });
                  }}
                  className="text-right"
                  placeholder="0.000"
                  disabled={disabled || !item.strAccountGUID}
                />
              </div>
            </TooltipTrigger>
            {!item.strAccountGUID && (
              <TooltipContent>
                <p>Please select an account first</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ];

  return (
    <DataEntryTable
      items={items}
      columns={columns}
      onItemUpdate={handleItemUpdate}
      onDeleteItem={handleDeleteItem}
      onAddItem={handleAddItem}
      getItemId={(item) =>
        getItemId(item as JournalItem) || `temp-${item.intSeqNo}`
      }
      getItemKey={(item, index) => {
        const itemId = getItemId(item as JournalItem);
        return itemId || `journal-item-${index}`;
      }}
      disabled={disabled}
    />
  );
};
