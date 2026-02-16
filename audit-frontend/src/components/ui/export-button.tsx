import { FileText, Download } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  exportMutation: UseMutationResult<
    void,
    Error,
    { format: "excel" | "csv" },
    unknown
  >;
  disabled?: boolean;
}

export function ExportButton({
  exportMutation,
  disabled = false,
}: ExportButtonProps) {
  const { mutate: handleExport, isPending } = exportMutation;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isPending}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isPending ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={() => handleExport({ format: "excel" })}
          disabled={isPending}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport({ format: "csv" })}
          disabled={isPending}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
