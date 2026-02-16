import React, { useState, useCallback } from "react";
import { Upload, Download, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { LEAD_IMPORTABLE_FIELDS } from "@/types/CRM/lead";
import type { LeadImportMappingDto } from "@/types/CRM/lead";
import {
  useImportLeads,
  useDownloadImportTemplate,
} from "@/hooks/api/CRM/use-leads";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = "upload" | "mapping" | "result";

const LeadImportDialog: React.FC<LeadImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(false);

  const { mutate: importLeads, isPending, data: importResult } = useImportLeads();
  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadImportTemplate();

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setMappings({});
    setSkipDuplicates(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);

      // Parse CSV headers (first line)
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const firstLine = text.split("\n")[0];
        const headers = firstLine
          .split(",")
          .map((h) => h.trim().replace(/^"|"$/g, ""));
        setCsvHeaders(headers);

        // Auto-map by matching header names to field labels/values
        const autoMap: Record<string, string> = {};
        for (const header of headers) {
          const normalized = header.toLowerCase().replace(/[_\s-]/g, "");
          const match = LEAD_IMPORTABLE_FIELDS.find((f) => {
            const fieldNorm = f.label.toLowerCase().replace(/[_\s-]/g, "");
            const valueNorm = f.value.toLowerCase().replace(/^str/, "");
            return (
              normalized === fieldNorm ||
              normalized === valueNorm ||
              normalized.includes(fieldNorm) ||
              fieldNorm.includes(normalized)
            );
          });
          if (match) {
            autoMap[header] = match.value;
          }
        }
        setMappings(autoMap);
        setStep("mapping");
      };
      reader.readAsText(selectedFile);
    },
    []
  );

  const handleMappingChange = (csvColumn: string, leadField: string) => {
    if (leadField === "__skip__") {
      setMappings((prev) => {
        const next = { ...prev };
        delete next[csvColumn];
        return next;
      });
    } else {
      setMappings((prev) => ({
        ...prev,
        [csvColumn]: leadField,
      }));
    }
  };

  const handleRemoveMapping = (csvColumn: string) => {
    setMappings((prev) => {
      const next = { ...prev };
      delete next[csvColumn];
      return next;
    });
  };

  const requiredFields = LEAD_IMPORTABLE_FIELDS.filter((f) => f.required).map(
    (f) => f.value
  );
  const mappedFields = Object.values(mappings);
  const missingRequired = requiredFields.filter(
    (f) => !mappedFields.includes(f)
  );

  const handleImport = () => {
    if (!file) return;

    const importMappings: LeadImportMappingDto[] = Object.entries(mappings).map(
      ([csvCol, leadField]) => ({
        strCsvColumn: csvCol,
        strLeadField: leadField,
      })
    );

    importLeads(
      { file, mappings: importMappings, skipDuplicates },
      {
        onSuccess: () => {
          setStep("result");
          onSuccess?.();
        },
      }
    );
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Leads from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file and map columns to lead fields.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop a CSV file, or click to browse
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadTemplate()}
                disabled={isDownloading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download Template"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === "mapping" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  File: {file?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {csvHeaders.length} columns detected
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setCsvHeaders([]);
                  setMappings({});
                  setStep("upload");
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Change File
              </Button>
            </div>

            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Required fields not mapped:{" "}
                  {missingRequired
                    .map(
                      (f) =>
                        LEAD_IMPORTABLE_FIELDS.find((lf) => lf.value === f)
                          ?.label || f
                    )
                    .join(", ")}
                </p>
              </div>
            )}

            {/* Mapping table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-foreground">
                      CSV Column
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-foreground">
                      Maps To
                    </th>
                    <th className="px-4 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {csvHeaders.map((header) => (
                    <tr key={header} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs text-foreground">
                        {header}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={mappings[header] || "__skip__"}
                          onValueChange={(val) =>
                            handleMappingChange(header, val)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Skip this column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">
                              Skip this column
                            </SelectItem>
                            {LEAD_IMPORTABLE_FIELDS.map((field) => (
                              <SelectItem
                                key={field.value}
                                value={field.value}
                                disabled={
                                  mappedFields.includes(field.value) &&
                                  mappings[header] !== field.value
                                }
                              >
                                {field.label}
                                {field.required ? " *" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        {mappings[header] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveMapping(header)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="skipDuplicates"
                checked={skipDuplicates}
                onCheckedChange={(checked) =>
                  setSkipDuplicates(checked === true)
                }
              />
              <label
                htmlFor="skipDuplicates"
                className="text-sm cursor-pointer text-foreground"
              >
                Skip duplicate leads (match by email)
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && importResult && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {importResult.intTotalRows}
                </p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.intCreated}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {importResult.intSkippedDuplicate}
                </p>
                <p className="text-xs text-muted-foreground">
                  Skipped (Dup)
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importResult.intFailed}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-1.5 text-foreground">Row</th>
                      <th className="text-left px-3 py-1.5 text-foreground">Field</th>
                      <th className="text-left px-3 py-1.5 text-foreground">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.errors.slice(0, 20).map((err, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{err.intRowNumber}</td>
                        <td className="px-3 py-1.5">{err.strField}</td>
                        <td className="px-3 py-1.5 text-red-600 dark:text-red-400">
                          {err.strMessage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          {step === "mapping" && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || missingRequired.length > 0}
              >
                {isPending ? "Importing..." : "Start Import"}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={handleClose}>Done</Button>
          )}
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadImportDialog;
