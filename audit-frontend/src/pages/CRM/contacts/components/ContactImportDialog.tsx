import React, { useMemo, useState } from "react";
import { Upload, Download, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";

import {
  CONTACT_IMPORTABLE_FIELDS,
  type ContactDuplicateHandling,
} from "@/types/CRM/contact";
import { useImportContacts } from "@/hooks/api/CRM/use-contacts";

import { Button } from "@/components/ui/button";
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

interface ContactImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStep = "upload" | "mapping" | "result";

const SKIP_VALUE = "__skip__";

const ContactImportDialog: React.FC<ContactImportDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] =
    useState<ContactDuplicateHandling>("Skip");

  const { mutate: importContacts, isPending, data: importResult } =
    useImportContacts();

  const requiredFields = useMemo(
    () =>
      CONTACT_IMPORTABLE_FIELDS.filter((field) => field.required).map(
        (field) => field.value
      ),
    []
  );

  const mappedFields = Object.values(mappings);
  const missingRequired = requiredFields.filter(
    (field) => !mappedFields.includes(field)
  );

  const resetState = React.useCallback(() => {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setMappings({});
    setDuplicateHandling("Skip");
  }, []);

  const closeDialog = () => onOpenChange(false);

  const wasOpenRef = React.useRef(open);
  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      resetState();
    }
    wasOpenRef.current = open;
  }, [open, resetState]);

  const normalize = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]/g, "");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = String(loadEvent.target?.result ?? "");
      const firstLine = text.split(/\r?\n/)[0] ?? "";
      const headers = firstLine
        .split(",")
        .map((header) => header.trim().replace(/^"|"$/g, ""))
        .filter((header) => header.length > 0);

      setCsvHeaders(headers);

      const autoMapping: Record<string, string> = {};
      for (const header of headers) {
        const normalizedHeader = normalize(header);
        const match = CONTACT_IMPORTABLE_FIELDS.find((field) => {
          const normalizedLabel = normalize(field.label);
          const normalizedValue = normalize(field.value.replace(/^str/, ""));
          return (
            normalizedHeader === normalizedLabel ||
            normalizedHeader === normalizedValue ||
            normalizedHeader.includes(normalizedLabel) ||
            normalizedLabel.includes(normalizedHeader)
          );
        });

        if (match) {
          autoMapping[header] = match.value;
        }
      }

      setMappings(autoMapping);
      setStep("mapping");
    };

    reader.readAsText(selectedFile);
  };

  const handleMappingChange = (csvColumn: string, value: string) => {
    setMappings((previous) => {
      const next = { ...previous };
      if (value === SKIP_VALUE) {
        delete next[csvColumn];
      } else {
        next[csvColumn] = value;
      }
      return next;
    });
  };

  const handleImport = () => {
    if (!file) return;

    importContacts(
      {
        file,
        columnMapping: mappings,
        duplicateHandling,
      },
      {
        onSuccess: () => {
          setStep("result");
          onSuccess?.();
        },
      }
    );
  };

  const downloadTemplate = () => {
    const headerRow = CONTACT_IMPORTABLE_FIELDS.map((field) => field.value).join(
      ","
    );
    const sampleRow = [
      "",
      "John",
      "Doe",
      "john.doe@example.com",
      "+1-555-0100",
      "+1-555-0101",
      "Manager",
      "Sales",
      "Lead",
      "123 Main St",
      "New York",
      "NY",
      "USA",
      "10001",
      "Imported from template",
      "",
    ].join(",");

    const csvContent = `${headerRow}\n${sampleRow}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contact-import-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Contacts from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file, map columns, and import contacts in bulk.
          </DialogDescription>
        </DialogHeader>

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
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">File: {file?.name}</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Duplicate Handling
                </label>
                <Select
                  value={duplicateHandling}
                  onValueChange={(value: ContactDuplicateHandling) =>
                    setDuplicateHandling(value)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Skip">Skip duplicates</SelectItem>
                    <SelectItem value="Update">Update existing</SelectItem>
                    <SelectItem value="Flag">Import and flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Required fields not mapped:{" "}
                  {missingRequired
                    .map(
                      (field) =>
                        CONTACT_IMPORTABLE_FIELDS.find((f) => f.value === field)
                          ?.label || field
                    )
                    .join(", ")}
                </p>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">CSV Column</th>
                    <th className="text-left px-4 py-2 font-medium">Maps To</th>
                  </tr>
                </thead>
                <tbody>
                  {csvHeaders.map((header) => (
                    <tr key={header} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">{header}</td>
                      <td className="px-4 py-2">
                        <Select
                          value={mappings[header] ?? SKIP_VALUE}
                          onValueChange={(value) =>
                            handleMappingChange(header, value)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={SKIP_VALUE}>
                              Skip this column
                            </SelectItem>
                            {CONTACT_IMPORTABLE_FIELDS.map((field) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "result" && importResult && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{importResult.intTotalRows}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-2xl font-bold text-green-600">
                  {importResult.intSuccessRows}
                </p>
                <p className="text-xs text-muted-foreground">Success</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <p className="text-2xl font-bold text-amber-600">
                  {importResult.intDuplicateRows}
                </p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-2xl font-bold text-red-600">
                  {importResult.intErrorRows}
                </p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          {step === "upload" && (
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
          )}
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={closeDialog} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  isPending || !file || Object.keys(mappings).length === 0 || missingRequired.length > 0
                }
              >
                {isPending ? "Importing..." : "Start Import"}
              </Button>
            </>
          )}
          {step === "result" && <Button onClick={closeDialog}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContactImportDialog;
