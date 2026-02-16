import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { useIsMobile } from "@/hooks/common/use-mobile";

export interface ColumnDefinition<T> {
  key: string;
  label: string;
  width: string;
  align?: "left" | "right" | "center";
  render: (
    item: T,
    index: number,
    onUpdate: (field: keyof T, value: string) => void
  ) => React.ReactNode;
}

interface DataEntryTableProps<T> {
  items: T[];
  columns: ColumnDefinition<T>[];
  onItemUpdate: (itemId: string, field: keyof T, value: string) => void;
  onDeleteItem?: ((itemId: string | null, index: number) => void) | undefined;
  onAddItem?: (() => void) | undefined;
  getItemId: (item: T) => string;
  getItemKey: (item: T, index: number) => string;
  disabled?: boolean;
}

export function DataEntryTable<T>({
  items,
  columns,
  onItemUpdate,
  onDeleteItem,
  onAddItem,
  getItemId,
  getItemKey,
  disabled = false,
}: DataEntryTableProps<T>) {
  const isMobile = useIsMobile();

  // Mobile card view
  if (isMobile) {
    return (
      <div className="w-full space-y-3">
        <div className="space-y-3">
          {items.map((item, index) => {
            const itemId = getItemId(item);
            const handleUpdate = (field: keyof T, value: string) => {
              onItemUpdate(itemId, field, value);
            };

            return (
              <Card
                key={getItemKey(item, index)}
                className="border-none shadow-none"
              >
                <CardContent className="p-3 space-y-3">
                  {columns.map((column) => (
                    <div key={column.key} className="space-y-1">
                      <Label className="text-xs font-medium">
                        {column.label}
                      </Label>
                      <div className="w-full">
                        {column.render(item, index, handleUpdate)}
                      </div>
                    </div>
                  ))}
                  <div className="flex border-t border-border justify-end pt-2">
                    {onDeleteItem && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(itemId, index)}
                        className="text-destructive hover:text-destructive"
                        disabled={disabled}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Add Row Button - Outside the cards */}
        {onAddItem && (
          <div className="pt-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              className="w-full"
              onClick={onAddItem}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add More Row
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="w-full space-y-3">
      <div className="border border-border rounded-(--radius) overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <Table className="w-full min-w-160 table-fixed bg-card dark:bg-card">
            <TableHeader className="bg-gray-200 border border-border dark:bg-muted">
              <TableRow key="header-row">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`${column.width} p-0 font-medium text-${
                      column.align || "left"
                    } text-xs sm:text-sm border border-border text-foreground`}
                  >
                    <span className="block w-full px-2 py-2">
                      {column.label}
                    </span>
                  </TableHead>
                ))}
                {onDeleteItem && (
                  <TableHead className="w-15 sm:w-[2.5%] p-0 border border-border"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const itemId = getItemId(item);
                const handleUpdate = (field: keyof T, value: string) => {
                  onItemUpdate(itemId, field, value);
                };

                return (
                  <TableRow
                    key={getItemKey(item, index)}
                    className="border-border rounded-lg hover:bg-transparent dark:hover:bg-transparent"
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className="p-0 align-top border border-border overflow-visible"
                      >
                        <div className="max-w-full">
                          {column.render(item, index, handleUpdate)}
                        </div>
                      </TableCell>
                    ))}
                    {onDeleteItem && (
                      <TableCell className="p-0 border border-border">
                        <div className="flex justify-center items-center h-full">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteItem(itemId, index)}
                            className="h-8 w-8 sm:h-9 sm:w-9 text-destructive dark:text-destructive hover:text-destructive hover:bg-transparent dark:hover:bg-transparent"
                            disabled={disabled}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Row Button - Outside the table */}
      {onAddItem && (
        <div className="flex justify-start ">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={onAddItem}
            disabled={disabled}
            className="min-w-30"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More Row
          </Button>
        </div>
      )}
    </div>
  );
}
