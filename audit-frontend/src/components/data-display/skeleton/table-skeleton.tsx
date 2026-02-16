import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface TableSkeletonProps {
  columns: string[] | { header: string; width?: string }[];
  pageSize?: number;
}

export function TableSkeleton({ columns, pageSize = 5 }: TableSkeletonProps) {
  const skeletonRows = pageSize > 5 ? 5 : pageSize;

  const normalizedColumns = columns.map((column) => {
    if (typeof column === "string") {
      return { header: column, width: undefined };
    }
    return column;
  });

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0">
        <Table className="w-full">
          <TableHeader className="bg-muted">
            <TableRow className="border-0">
              {normalizedColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className="px-3 py-1.5 whitespace-nowrap text-muted-foreground"
                  style={
                    column.width
                      ? { width: column.width, minWidth: column.width }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(skeletonRows)
              .fill(0)
              .map((_, index) => (
                <TableRow key={index} className="border-0">
                  {normalizedColumns.map((column, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className="px-3 py-1.5 whitespace-nowrap"
                      style={
                        column.width
                          ? { width: column.width, minWidth: column.width }
                          : undefined
                      }
                    >
                      {(() => {
                        const columnName = column.header?.toLowerCase();

                        if (
                          columnName === "actions" ||
                          columnName === "action"
                        ) {
                          return (
                            <div className="flex gap-2">
                              <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                          );
                        }

                        if (columnName === "status") {
                          return <Skeleton className="h-6 w-24 rounded-full" />;
                        }

                        if (
                          columnName?.includes("created by") ||
                          columnName?.includes("updated by")
                        ) {
                          return <Skeleton className="h-6 w-48" />;
                        }

                        if (
                          columnName?.includes("date") ||
                          columnName?.includes("created on") ||
                          columnName?.includes("updated on")
                        ) {
                          return <Skeleton className="h-6 w-40" />;
                        }

                        if (columnName?.includes("name")) {
                          return <Skeleton className="h-6 w-44" />;
                        }

                        if (
                          columnName?.includes("submenu") ||
                          columnName?.includes("has submenu")
                        ) {
                          return <Skeleton className="h-6 w-28" />;
                        }

                        if (columnName?.includes("parent menu")) {
                          return <Skeleton className="h-6 w-40" />;
                        }

                        if (
                          columnName?.includes("admin only") ||
                          columnName?.includes("super admin")
                        ) {
                          return <Skeleton className="h-6 w-40" />;
                        }

                        return <Skeleton className="h-6 w-36" />;
                      })()}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-1 border-border border-t">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <div>
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
