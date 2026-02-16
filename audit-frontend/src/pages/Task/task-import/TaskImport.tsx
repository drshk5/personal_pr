import React, { useState, useCallback, useMemo, useRef } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { List, type RowComponentProps } from "react-window";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  Play,
  History,
  Info,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import {
  type ExcelPreviewData,
  type TaskColumnMapping,
  type ImportResult,
  type ImportError,
  type ImportSummaryItem,
  type ImportProgress,
  type TaskImportStatistics,
} from "@/types/task";
import {
  usePreviewExcel,
  useImportTasks,
  useImportProgress,
  useImportErrors,
  useImportStatistics,
  useStopImport,
} from "@/hooks/api/task";
import { useImportSignalRProgress } from "@/hooks/api/task/use-import-signalr";
import {
  validateExcelFile,
  validateRequiredMappings,
} from "@/validations/task";

import CustomContainer from "@/components/layout/custom-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-tables/DataTable";

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

const LAST_IMPORT_STORAGE_KEY = "taskImport:lastImport";

const REQUIRED_FIELDS = [
  { key: "taskBoard", label: "Task Project", required: true },
  { key: "userName", label: "User Name (Assigned To)", required: true },
  { key: "taskNo", label: "Task No", required: true },
  { key: "taskTitle", label: "Task Title", required: true },
  { key: "taskDesc", label: "Task Description", required: true },
  { key: "startDate", label: "Start Date", required: true },
  { key: "boardSection", label: "Project module", required: true },
  { key: "status", label: "Status", required: true },
];

const OPTIONAL_FIELDS = [
  { key: "subModule", label: "Sub Module", required: false },
  { key: "taskTags", label: "Task Tags", required: false },
  { key: "taskStartTime", label: "Task Start Time", required: false },
  { key: "taskEndTime", label: "Task End Time", required: false },
  { key: "dueDate", label: "Due On", required: false },
  { key: "ticketKey", label: "Ticket Key", required: false },
  { key: "ticketUrl", label: "Ticket URL", required: false },
  { key: "ticketSource", label: "Ticket Source", required: false },
  { key: "priority", label: "Priority", required: false },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

const SUPPORTED_STATUSES = [
  "Not Started",
  "Started",
  "On Hold",
  "For Review",
  "Completed",
  "Incomplete",
  "Reassign",
];

export default function TaskImport() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ExcelPreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<TaskColumnMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string>("");
  const [showProgress, setShowProgress] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState("");

  const pageSize = 20;

  // On mount, resume an in-flight import if one was persisted
  React.useEffect(() => {
    const saved = localStorage.getItem(LAST_IMPORT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { importId?: string };
      if (parsed?.importId) {
        setImportId(parsed.importId);
        setCurrentStep("importing");
      }
    } catch {
      localStorage.removeItem(LAST_IMPORT_STORAGE_KEY);
    }
  }, []);

  // Hooks
  const previewExcelMutation = usePreviewExcel();
  const importTasksMutation = useImportTasks();
  const stopImportMutation = useStopImport();

  // ✅ Use SignalR for active imports (real-time updates via WebSocket)
  // This replaces the 2-second polling interval
  const { progress: signalRProgress } = useImportSignalRProgress(
    importId || undefined,
    currentStep === "importing"
  );

  // No HTTP polling for active imports; SignalR only
  const { data: httpProgressData } = useImportProgress(
    importId || undefined,
    false
  ) as UseQueryResult<ImportProgress>;

  // Use SignalR data if available, fallback to HTTP
  const progressData = signalRProgress || httpProgressData;

  // ✅ Use SignalR for selected import if it's still processing
  const { progress: selectedSignalRProgress } = useImportSignalRProgress(
    selectedImportId || undefined,
    showProgress && !!selectedImportId && currentStep !== "importing"
  );

  const { data: selectedHttpProgressData } = useImportProgress(
    selectedImportId || undefined,
    showProgress && !!selectedImportId && !selectedSignalRProgress
  ) as UseQueryResult<ImportProgress>;

  const selectedProgressData =
    selectedSignalRProgress || selectedHttpProgressData;
  const { data: selectedErrorsData = [] } = useImportErrors(
    selectedImportId || undefined,
    showErrors && !!selectedImportId
  ) as UseQueryResult<ImportError[]>;
  const { data: statisticsData } = useImportStatistics(
    historyPage,
    pageSize,
    historySearch.trim() || undefined,
    showHistory
  ) as UseQueryResult<TaskImportStatistics>;

  const errorRows: ImportError[] = useMemo(
    () => selectedErrorsData ?? [],
    [selectedErrorsData]
  );

  const activeImportId = selectedImportId || importId || "";
  const activeImportFileName = useMemo(() => {
    const targetId = selectedImportId || importId;
    if (!targetId) return undefined;
    const match = statisticsData?.data?.find(
      (item) => item.importId === targetId
    );
    return match?.fileName;
  }, [importId, selectedImportId, statisticsData]);

  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 900
  );

  React.useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const errorListHeight = useMemo(() => {
    if (!errorRows.length) return 0;
    const perRow = 144; // slightly taller to create visible gap between cards
    const desired = errorRows.length * perRow;
    const maxUsable = Math.max(360, viewportHeight - 200);
    return Math.min(Math.max(320, desired), Math.min(maxUsable, 1000));
  }, [errorRows.length, viewportHeight]);

  const ErrorRow = useCallback(
    ({
      index,
      style,
      ariaAttributes,
      errors,
    }: RowComponentProps<{ errors: ImportError[] }>) => {
      const error = errors[index];
      if (!error) return <div style={style} {...ariaAttributes} />;

      return (
        <div style={style} {...ariaAttributes} className="px-1 pb-3">
          <Alert
            key={error.errorGuid ?? index}
            variant="destructive"
            className="p-3 h-full"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertTitle className="text-xs">
              Error {index + 1} - Row {error.rowNumber} - {error.columnName}
            </AlertTitle>
            <AlertDescription className="text-xs">
              <div className="space-y-0.5 mt-2">
                <div>
                  <span className="font-medium">Error:</span>{" "}
                  {error.errorMessage}
                </div>
                {error.columnValue && (
                  <div className="text-xs">
                    <span className="font-medium">Value:</span>{" "}
                    {error.columnValue}
                  </div>
                )}
                <div className="text-xs">
                  <span className="font-medium">Code:</span> {error.errorCode}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    },
    []
  );

  const isProcessing =
    previewExcelMutation.isPending || importTasksMutation.isPending;

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]).catch(() => {
        // Error already handled in processFile
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process selected file
  const processFile = async (file: File) => {
    // Validate file
    const fileValidation = validateExcelFile(file);
    if (!fileValidation.isValid) {
      toast.error(fileValidation.message);
      return;
    }

    setSelectedFile(file);

    try {
      const preview = await previewExcelMutation.mutateAsync(file);
      setPreviewData(preview);

      // Auto-detect column mapping
      const autoMapping = autoDetectMapping(preview.columnHeaders);
      setColumnMapping(autoMapping);

      setCurrentStep("mapping");
      toast.success("File uploaded successfully");
    } catch {
      setSelectedFile(null);
    } finally {
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file selection
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // Auto-detect column mapping based on header names
  const autoDetectMapping = (headers: string[]): TaskColumnMapping => {
    const mapping: TaskColumnMapping = {};
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    const detectColumn = (keywords: string[]) => {
      for (const keyword of keywords) {
        const index = lowerHeaders.findIndex((h) => h.includes(keyword));
        if (index >= 0) return headers[index];
      }
      return undefined;
    };

    mapping.taskNo = detectColumn([
      "task no",
      "taskno",
      "ref no",
      "refno",
      "task ref",
    ]);
    mapping.taskTitle = detectColumn(["title", "task title", "subject"]);
    mapping.taskDesc = detectColumn([
      "description",
      "task desc",
      "task",
      "details",
    ]);
    mapping.startDate = detectColumn(["start date", "date", "task date", "dt"]);
    mapping.taskBoard = detectColumn([
      "board",
      "project",
      "task board",
      "client",
    ]);
    mapping.boardSection = detectColumn([
      "section",
      "board section",
      "function",
      "phase",
    ]);
    mapping.subModule = detectColumn([
      "sub module",
      "submodule",
      "sub-module",
      "sub module name",
    ]);
    mapping.taskTags = detectColumn(["tags", "task tags", "type", "task type"]);
    mapping.taskStartTime = detectColumn(["start time", "starttime", "start"]);
    mapping.taskEndTime = detectColumn(["end time", "endtime", "end"]);
    mapping.status = detectColumn(["status", "task status"]);
    mapping.userName = detectColumn([
      "user",
      "assigned",
      "assigned to",
      "owner",
      "resource",
      "user name",
    ]);
    mapping.dueDate = detectColumn([
      "due on",
      "due date",
      "duedate",
      "end date",
      "enddate",
    ]);
    mapping.ticketKey = detectColumn(["ticket key", "ticketkey", "ticket id"]);
    mapping.ticketUrl = detectColumn([
      "ticket url",
      "ticketurl",
      "ticket link",
    ]);
    mapping.ticketSource = detectColumn(["ticket source", "ticketsource"]);
    mapping.priority = detectColumn(["priority"]);

    return mapping;
  };

  // Update column mapping
  const handleMappingChange = (field: string, columnName: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [field]: columnName === "none" ? undefined : columnName,
    }));
  };

  // Validate mapping
  const validateMapping = (): boolean => {
    const validation = validateRequiredMappings(
      columnMapping as Record<string, string | undefined>
    );

    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    return true;
  };

  // Proceed to preview
  const handleProceedToPreview = () => {
    if (!validateMapping()) return;
    setCurrentStep("preview");
  };

  // Execute import
  const handleImport = async () => {
    if (!selectedFile || !validateMapping()) return;

    // Clear any previous import results to prevent cache issues
    setImportResult(null);
    setCurrentStep("importing");

    try {
      const initiatedResponse = await importTasksMutation.mutateAsync({
        file: selectedFile,
        columnMapping,
      });
      setImportId(initiatedResponse.importId);
      localStorage.setItem(
        LAST_IMPORT_STORAGE_KEY,
        JSON.stringify({
          importId: initiatedResponse.importId,
          startedAt: Date.now(),
        })
      );
      toast.success(
        "Import started! You can navigate away and check progress in History."
      );
    } catch {
      setCurrentStep("preview");
      toast.error("Import failed to start. Please try again.");
    }
  };

  // Effect to handle progress updates from the hook
  React.useEffect(() => {
    if (!progressData) return;

    if (progressData.status === "Completed") {
      const processedRows = progressData.processedRows || progressData.totalRows;
      let successCount = progressData.successCount;
      let failureCount = progressData.failureCount;
      
      const accountedRows = successCount + failureCount;
      if (accountedRows < processedRows) {
        const missingRows = processedRows - accountedRows;
        if (failureCount === 0 && (!progressData.recentErrors || progressData.recentErrors.length === 0)) {
          successCount += missingRows;
        } else {
          failureCount += missingRows;
        }
      }
      
      // Construct result from progressData if not provided
      const result = progressData.result || {
        success: failureCount === 0,
        message:
          failureCount === 0
            ? "Import completed successfully"
            : "Import completed with errors",
        summary: {
          totalRows: progressData.totalRows,
          processedRows: processedRows,
          successCount: successCount,
          failureCount: failureCount,
          failedRows: failureCount,
          errorMessages: [],
          rowErrors: progressData.recentErrors || [],
          boardsCreated: 0,
          sectionsCreated: 0,
          tagsCreated: 0,
          timersCreated: 0,
          checklistItemsCreated: 0,
          processingTime: "",
          importStartedAt: progressData.startTime,
          importCompletedAt: new Date().toISOString(),
        },
        createdTasks: [],
        validationErrors: [],
        failedRows: [],
        detailedErrors: [],
      };
      setImportResult(result);
      setCurrentStep("complete");
      setImportId(null);
      localStorage.removeItem(LAST_IMPORT_STORAGE_KEY);
      toast.success("Import completed successfully!");
    } else if (progressData.status === "Failed") {
      // Validate counts for failed imports too
      const processedRows = progressData.processedRows || 0;
      let successCount = progressData.successCount;
      let failureCount = progressData.failureCount;
      
      // Fix inconsistent counts
      const accountedRows = successCount + failureCount;
      if (accountedRows < processedRows) {
        const missingRows = processedRows - accountedRows;
        failureCount += missingRows; // Assume missing rows failed
      }
      
      // Construct result from progressData if not provided
      const result = progressData.result || {
        success: false,
        message: "Import failed",
        summary: {
          totalRows: progressData.totalRows,
          processedRows: processedRows,
          successCount: successCount,
          failureCount: failureCount,
          failedRows: failureCount,
          errorMessages: [progressData.currentStep],
          rowErrors: progressData.recentErrors || [],
          boardsCreated: 0,
          sectionsCreated: 0,
          tagsCreated: 0,
          timersCreated: 0,
          checklistItemsCreated: 0,
          processingTime: "",
          importStartedAt: progressData.startTime,
          importCompletedAt: new Date().toISOString(),
        },
        createdTasks: [],
        validationErrors: [],
        failedRows: [],
        detailedErrors: [],
      };
      setImportResult(result);
      setCurrentStep("complete");
      setImportId(null);
      localStorage.removeItem(LAST_IMPORT_STORAGE_KEY);
      toast.error("Import failed. Check errors for details.");
    }
  }, [progressData]);

  // Reset form
  const handleReset = () => {
    setCurrentStep("upload");
    setSelectedFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setImportResult(null);
    localStorage.removeItem(LAST_IMPORT_STORAGE_KEY);
  };

  // Stop/Cancel import
  const handleStopImport = async () => {
    if (!importId) return;

    if (
      !confirm(
        "Are you sure you want to stop this import? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await stopImportMutation.mutateAsync(importId);
      setImportId(null);
      setCurrentStep("upload");
      setSelectedFile(null);
      setPreviewData(null);
      setColumnMapping({});
      localStorage.removeItem(LAST_IMPORT_STORAGE_KEY);
      toast.success("Import stopped successfully. You can start a new import.");
    } catch (error) {
      toast.error("Failed to stop import. Please try again.");
    }
  };

  const handleExportErrorsExcel = useCallback(() => {
    if (!errorRows.length) {
      toast.info("No errors to export yet.");
      return;
    }

    const rows = errorRows.map((error, idx) => ({
      "#": idx + 1,
      "Row Number": error.rowNumber,
      "Column Name": error.columnName,
      "Column Value": error.columnValue ?? "",
      "Error Code": error.errorCode,
      "Error Message": error.errorMessage,
      "Created On": error.createdOn,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");

    const baseName = (activeImportFileName || "task-import").replace(
      /\s+/g,
      "-"
    );
    const nameSuffix = activeImportId || "latest";
    XLSX.writeFile(workbook, `${baseName}-errors-${nameSuffix}.xlsx`);
  }, [errorRows, activeImportFileName, activeImportId]);

  const handleExportErrorsPdf = useCallback(() => {
    if (!errorRows.length) {
      toast.info("No errors to export yet.");
      return;
    }

    const htmlRows = errorRows
      .map(
        (error, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${error.rowNumber}</td>
          <td>${error.columnName}</td>
          <td>${error.columnValue ?? ""}</td>
          <td>${error.errorCode}</td>
          <td>${error.errorMessage}</td>
          <td>${error.createdOn}</td>
        </tr>`
      )
      .join("");

    const popup = window.open("", "_blank");
    if (!popup) {
      toast.warning("Popup blocked. Please allow popups to export PDF.");
      return;
    }
    popup.opener = null;

    popup.document.write(`<!DOCTYPE html>
      <html>
        <head>
          <title>Task Import Errors</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; color: #0f172a; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Task Import Errors</h1>
          <p><strong>Total Errors:</strong> ${errorRows.length}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Row</th>
                <th>Column</th>
                <th>Value</th>
                <th>Code</th>
                <th>Message</th>
                <th>Created On</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>`);
    popup.document.close();
  }, [errorRows]);

  const renderMapping = () => {
    if (!previewData) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold mb-1">
            Map Excel Columns to Task Fields
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Match your Excel columns to the corresponding task fields. Required
            fields are marked with *
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {ALL_FIELDS.map((field) => (
            <div
              key={field.key}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-start md:items-center p-3 sm:p-4 rounded-lg border border-border-color"
            >
              <div className="space-y-1">
                <Label className="text-sm sm:text-base font-medium text-foreground flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {field.required ? "Required field" : "Optional field"}
                </p>
              </div>
              <div className="md:col-span-2">
                <Select
                  value={
                    columnMapping[field.key as keyof TaskColumnMapping] ||
                    "none"
                  }
                  onValueChange={(value: string) =>
                    handleMappingChange(field.key, value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Excel column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-muted-foreground">
                      -- Not Mapped --
                    </SelectItem>
                    {previewData.columnHeaders.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-border-color">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("upload")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
          <Button
            onClick={handleProceedToPreview}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            Continue to Preview
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const sortedImportList = useMemo<ImportSummaryItem[]>(() => {
    const list = statisticsData?.data ?? [];
    return [...list].sort(
      (a, b) =>
        new Date(b.createdOn).getTime() - new Date(a.createdOn).getTime()
    );
  }, [statisticsData]);

  // Render preview section
  const renderPreview = () => {
    if (!previewData) return null;

    const getMappedValue = (
      row: Record<string, string>,
      field: keyof TaskColumnMapping
    ) => {
      const columnName = columnMapping[field];
      return columnName ? row[columnName] : "-";
    };

    const mappedFields = ALL_FIELDS.filter(
      (f) => columnMapping[f.key as keyof TaskColumnMapping]
    );

    // Transform sample data to include all mapped values
    const transformedData = previewData.sampleData.map((row, idx) => {
      const transformedRow: Record<string, string> = { _id: String(idx) };
      mappedFields.forEach((field) => {
        transformedRow[field.key] = getMappedValue(
          row,
          field.key as keyof TaskColumnMapping
        );
      });
      return transformedRow;
    });

    // Define columns for DataTable
    const columns: DataTableColumn<Record<string, string>>[] = mappedFields.map(
      (field) => ({
        key: field.key,
        header: `${field.label}${field.required ? " *" : ""}`,
        sortable: false,
        width: "200px",
        cell: (item) => (
          <div className="font-mono text-xs sm:text-sm">
            {item[field.key] && item[field.key] !== "-" ? (
              item[field.key]
            ) : (
              <span className="text-muted-foreground italic">Empty</span>
            )}
          </div>
        ),
      })
    );

    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="text-base text-foreground sm:text-lg font-semibold mb-1">
              Preview Import Data
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review the first few rows to ensure the mapping is correct.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
              {previewData.totalRows} rows to import
            </span>
          </div>
        </div>

        <DataTable
          data={transformedData}
          columns={columns}
          keyExtractor={(item) => item._id}
        />

        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-border-color">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("mapping")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mapping
          </Button>
          <Button
            onClick={handleImport}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <span
                  className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"
                  aria-hidden
                />
                Starting Import...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Import
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render results
  const renderResults = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-border-color/80 shadow-sm">
          <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center gap-3 text-lg sm:text-xl md:text-2xl">
              {importResult.success ? (
                <div className="p-2.5 sm:p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600" />
                </div>
              ) : (
                <div className="p-2.5 sm:p-3 rounded-full bg-amber-50 dark:bg-amber-900/20">
                  <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-600" />
                </div>
              )}
              <div className="text-center sm:text-left">
                <div className="text-foreground">
                  Import{" "}
                  {importResult.success ? "Completed" : "Completed with Issues"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                  {importResult.success
                    ? "All tasks were successfully imported"
                    : "Some tasks encountered errors during import"}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-4 sm:p-6 bg-linear-to-br from-sky-50/70 via-white to-white dark:from-sky-500/5 dark:via-white/5 dark:to-white/5 rounded-xl border border-sky-200/50 dark:border-sky-800/30">
                <div className="text-2xl sm:text-3xl font-bold text-sky-600">
                  {importResult.summary.totalRows}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Total Rows
                </div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-linear-to-br from-emerald-50/70 via-white to-white dark:from-emerald-500/5 dark:via-white/5 dark:to-white/5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  {importResult.summary.successCount}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Successful
                </div>
              </div>
              <div className="text-center p-4 sm:p-6 bg-linear-to-br from-red-50/70 via-white to-white dark:from-red-500/5 dark:via-white/5 dark:to-white/5 rounded-xl border border-red-200/50 dark:border-red-800/30">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">
                  {importResult.summary.failureCount}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Failed
                </div>
              </div>
            </div>

            {(importResult.validationErrors.length > 0 ||
              (importResult.summary.errorMessages &&
                importResult.summary.errorMessages.length > 0) ||
              (importResult.summary.rowErrors &&
                importResult.summary.rowErrors.length > 0)) && (
              <div>
                <h4 className="font-semibold mb-2">Import Issues:</h4>
                <div className="max-h-96 border border-border-color rounded p-4 overflow-auto space-y-2">
                  {/* Display row-specific errors from import batches */}
                  {importResult.summary.rowErrors?.map((error, idx) => (
                    <Alert
                      key={`row-${error.errorGuid || idx}`}
                      variant="destructive"
                      className="mb-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        Row {error.rowNumber} - {error.columnName}
                      </AlertTitle>
                      <AlertDescription>
                        <div>{error.errorMessage}</div>
                        {error.columnValue && (
                          <div className="text-xs mt-1 text-muted-foreground">
                            Value: {error.columnValue}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}

                  {/* Display row-specific validation errors */}
                  {importResult.validationErrors.map((error, idx) => (
                    <Alert
                      key={`validation-${idx}`}
                      variant="destructive"
                      className="mb-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Row {error.rowNumber}</AlertTitle>
                      <AlertDescription>{error.errorMessage}</AlertDescription>
                    </Alert>
                  ))}

                  {/* Display general error messages from summary */}
                  {importResult.summary.errorMessages?.map(
                    (errorMessage, idx) => (
                      <Alert
                        key={`summary-${idx}`}
                        variant="destructive"
                        className="mb-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Import Warning</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/welcome")}
                className="w-full sm:w-auto"
              >
                View My Tasks
              </Button>
              <Button onClick={handleReset} className="w-full sm:w-auto">
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <CustomContainer>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Task Import
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Import tasks from Excel files with automatic field mapping
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/welcome")}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sm:inline">Back to Tasks</span>
          </Button>
        </div>
      </div>

      <Sheet open={showProgress} onOpenChange={setShowProgress}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-5 pb-6 pt-4">
          <SheetHeader className="mb-2">
            <div className="flex items-center gap-2">
              <span
                className="p-1 rounded hover:bg-muted cursor-pointer text-foreground"
                onClick={() => {
                  setShowProgress(false);
                  setShowHistory(true);
                }}
                aria-label="Back to history"
                role="button"
              >
                <ArrowLeft className="h-4 w-4" />
              </span>
              <SheetTitle className="text-base font-semibold">
                Import Progress
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="mt-4">
            {selectedProgressData ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border-color shadow-sm bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Status
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedProgressData.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : selectedProgressData.status === "Failed"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : selectedProgressData.status === "Processing"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {selectedProgressData.status}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span className="font-medium text-foreground">
                        {selectedProgressData.progressPercentage}%
                      </span>
                    </div>
                    <Progress
                      value={selectedProgressData.progressPercentage}
                      className="h-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 px-1">
                  <Card className="border-border-color shadow-sm rounded-lg">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-foreground">
                        {selectedProgressData.processedRows}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        of {selectedProgressData.totalRows}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border-color shadow-sm rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-emerald-600">
                        {selectedProgressData.successCount}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Successful
                      </div>
                    </CardContent>
                  </Card>
                  <button
                    type="button"
                    onClick={() => setShowErrors(true)}
                    className="p-3 rounded-lg border border-border-color bg-red-50/50 dark:bg-red-900/10 text-left transition hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <div className="text-lg font-bold text-red-600">
                      {selectedProgressData.failureCount}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Failed · Click to view
                    </div>
                  </button>
                  <Card className="border-border-color shadow-sm rounded-lg">
                    <CardContent className="p-3">
                      <div className="text-lg font-bold text-foreground">
                        {selectedProgressData.progressPercentage}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Complete
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedProgressData.currentStep && (
                  <Card className="border-border-color shadow-sm rounded-lg">
                    <CardContent className="p-3 space-y-1">
                      <div className="text-xs text-muted-foreground mb-1">
                        Current Step
                      </div>
                      <div className="text-sm font-medium text-foreground/90">
                        {selectedProgressData.currentStep}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedProgressData.result && (
                  <Card className="border-border-color shadow-sm rounded-lg">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        Result
                      </div>
                      <div className="text-xs">
                        {selectedProgressData.result.message}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No progress data found for this Import ID
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showErrors} onOpenChange={setShowErrors}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-1">
            <div className="flex items-center gap-2">
              <span
                className="p-1 rounded hover:bg-muted cursor-pointer text-foreground"
                onClick={() => {
                  setShowErrors(false);
                  setShowProgress(true);
                }}
                aria-label="Back to progress"
                role="button"
              >
                <ArrowLeft className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-base">Import Errors</SheetTitle>
                {selectedErrorsData && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 whitespace-nowrap">
                    {selectedErrorsData.length} error(s)
                  </span>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="px-3 pb-3 pt-1 space-y-2 text-xs text-muted-foreground">
            <div className="rounded-md border border-border-color/60 bg-muted/30 px-3 py-2 text-foreground">
              <div className="flex flex-col gap-1 text-sm">
                {activeImportFileName && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">File:</span>
                    <span className="text-muted-foreground">
                      {activeImportFileName}
                    </span>
                  </div>
                )}
                {activeImportId && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Import ID:
                    </span>
                    <span className="text-muted-foreground">
                      {activeImportId}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportErrorsExcel}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportErrorsPdf}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="mt-3">
            {selectedErrorsData && selectedErrorsData.length > 0 ? (
              <div className="p-2 rounded-lg space-y-2">
                <List
                  defaultHeight={errorListHeight || 360}
                  rowCount={errorRows.length}
                  rowHeight={144}
                  rowComponent={ErrorRow}
                  rowProps={{ errors: errorRows }}
                  style={{ height: errorListHeight || 360, width: "100%" }}
                  className="w-full"
                />
              </div>
            ) : selectedErrorsData && selectedErrorsData.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No errors found for this import
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No error data found for this Import ID
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Progress Steps */}
      {currentStep !== "complete" && (
        <div className="mb-4 sm:mb-8 space-y-4">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-4">
            {["upload", "mapping", "preview", "importing"].map((step, idx) => (
              <React.Fragment key={step}>
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 transition-colors duration-200 ${
                    currentStep === step
                      ? "text-primary"
                      : ["upload", "mapping", "preview", "importing"].indexOf(
                            currentStep
                          ) > idx
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 font-medium text-xs sm:text-sm transition-all duration-200 ${
                      currentStep === step
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : ["upload", "mapping", "preview", "importing"].indexOf(
                              currentStep
                            ) > idx
                          ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                          : "border-muted-foreground/30 bg-muted/30"
                    }`}
                  >
                    {["upload", "mapping", "preview", "importing"].indexOf(
                      currentStep
                    ) > idx ? (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="font-medium capitalize text-xs sm:text-sm hidden md:block">
                    {step}
                  </span>
                </div>
                {idx < 3 && (
                  <div className="w-4 sm:w-6 md:w-12 h-0.5 bg-border transition-colors duration-200" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Upload Step */}
      {currentStep === "upload" && (
        <Card className="border-border-color/80 shadow-sm">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="relative flex flex-col sm:flex-row items-center justify-center">
              <div className="flex flex-col items-center text-center gap-1 mx-auto">
                <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
                  <FileSpreadsheet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Upload Excel File
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Upload an Excel file (.xlsx or .xls) containing your tasks.
                  Maximum file size: 10MB
                </CardDescription>
              </div>

              <div className="sm:absolute sm:right-0 sm:top-0 mt-3 sm:mt-0 w-full sm:w-auto">
                <Sheet open={showHistory} onOpenChange={setShowHistory}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(true)}
                      className="flex items-center gap-2 w-full sm:w-auto shadow-sm"
                    >
                      <History className="h-4 w-4" />
                      History
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-md overflow-y-auto px-5 pb-6 pt-4">
                    <SheetHeader className="flex flex-row items-center justify-between gap-2">
                      <div>
                        <SheetTitle className="text-base font-semibold">
                          Import History
                        </SheetTitle>
                        <SheetDescription className="text-xs">
                          View all past imports and their status
                        </SheetDescription>
                      </div>
                    </SheetHeader>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={historySearch}
                          onChange={(e) => {
                            setHistorySearch(e.target.value);
                            setHistoryPage(1);
                          }}
                          placeholder="Search by file name"
                          className="w-full rounded-md border border-border-color/80 px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground dark:border-border-color focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>

                      {sortedImportList.length > 0 ? (
                        <>
                          <div className="space-y-3 pt-1">
                            {sortedImportList.map((importItem) => (
                              <div
                                key={importItem.importId}
                                className="p-3 rounded-lg border border-border-color/80 bg-card text-card-foreground hover:bg-muted/60 dark:bg-card/80 dark:hover:bg-muted/40 transition-colors cursor-pointer shadow-sm"
                                onClick={() => {
                                  setSelectedImportId(importItem.importId);
                                  setShowHistory(false);
                                  setShowProgress(true);
                                }}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span
                                        className="font-medium text-xs truncate"
                                        title={importItem.fileName}
                                      >
                                        {importItem.fileName}
                                      </span>
                                    </div>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0 whitespace-nowrap ${
                                        importItem.status === "COMPLETED"
                                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                          : importItem.status === "FAILED"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            : importItem.status === "PROCESSING"
                                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                              : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                                      }`}
                                    >
                                      {importItem.status}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1">
                                    <div className="text-[11px]">
                                      <span className="text-muted-foreground">
                                        Total:
                                      </span>
                                      <span className="font-semibold ml-1 text-foreground">
                                        {importItem.totalRows}
                                      </span>
                                    </div>
                                    <div className="text-[11px]">
                                      <span className="text-muted-foreground">
                                        Success:
                                      </span>
                                      <span className="font-semibold ml-1 text-emerald-600">
                                        {importItem.successRows}
                                      </span>
                                    </div>
                                    <div className="text-[11px]">
                                      <span className="text-muted-foreground">
                                        Failed:
                                      </span>
                                      <span className="font-semibold ml-1 text-red-600">
                                        {importItem.failedRows}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border-color/40">
                                    {new Date(
                                      importItem.createdOn
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                            <span>
                              Page {statisticsData?.pageNumber ?? historyPage}{" "}
                              of {statisticsData?.totalPages ?? 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setHistoryPage((p) => Math.max(1, p - 1))
                                }
                                disabled={
                                  historyPage <= 1 ||
                                  statisticsData?.hasPreviousPage === false
                                }
                              >
                                Prev
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setHistoryPage((p) => p + 1)}
                                disabled={
                                  statisticsData?.hasNextPage === false ||
                                  (statisticsData?.totalPages ?? 1) <=
                                    historyPage
                                }
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <History className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                          <p className="text-lg font-medium text-foreground mb-2">
                            No Import History
                          </p>
                          <p className="text-sm text-muted-foreground">
                            You haven't imported any tasks yet. Upload an Excel
                            file to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 sm:p-8 md:p-12 space-y-3 sm:space-y-4 transition-all duration-200 cursor-pointer ${
                isDragActive
                  ? "border-primary bg-primary/5 scale-105"
                  : "border-border-color/60 hover:border-primary/50 hover:bg-accent/20"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <div
                className={`p-3 sm:p-4 rounded-full transition-colors duration-200 ${
                  isDragActive ? "bg-primary/10" : "bg-primary/5"
                }`}
              >
                <Upload
                  className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-200 ${
                    isDragActive ? "text-primary" : "text-primary"
                  }`}
                />
              </div>
              <div className="text-center">
                <p className="text-sm sm:text-base text-foreground font-medium mb-1">
                  {isDragActive
                    ? "Drop your file here"
                    : "Drag and drop your Excel file here"}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  or click to browse your files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="relative overflow-hidden rounded-xl border border-border-color/70 bg-muted/30 dark:bg-slate-900/60 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
                <div
                  className="absolute inset-y-0 left-0 w-1 bg-primary/70"
                  aria-hidden
                />
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 sm:p-2 text-primary shrink-0">
                    <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="space-y-2 text-foreground">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary border border-primary/30">
                        Important
                      </span>
                      <span className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                        Avoid validation failures on date/time columns.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        Date format:{" "}
                        <span className="font-normal text-muted-foreground">
                          YYYY-MM-DD (e.g. 2024-08-15)
                        </span>
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        DateTime format:{" "}
                        <span className="font-normal text-muted-foreground">
                          YYYY-MM-DD HH:MM (24h) or YYYY-MM-DD HH:MM AM/PM
                        </span>
                      </p>
                    </div>

                    <div className="text-xs sm:text-[13px] leading-relaxed text-foreground/80">
                      Excel cells must be real Date/DateTime cells (not text).
                      If you paste values, reformat Start Date (and time)
                      columns as Date/DateTime before saving.
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        Supported Status values:
                      </p>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {SUPPORTED_STATUSES.map((status) => (
                          <span
                            key={status}
                            className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-border-color/60 bg-muted/60 text-foreground shadow-sm dark:bg-slate-800/70"
                          >
                            {status}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center sm:justify-start">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing file...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {currentStep === "mapping" && renderMapping()}

      {/* Preview Step */}
      {currentStep === "preview" && renderPreview()}

      {/* Importing Step */}
      {currentStep === "importing" && (
        <Card className="border-border-color/80 shadow-sm">
          <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 rounded-full bg-primary/10">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-3 border-primary border-t-transparent"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Processing Import...
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Please wait while we import your tasks. This may take a few
                  moments.
                </p>
              </div>

              {progressData && (
                <div className="w-full max-w-md space-y-3 sm:space-y-4 px-4 sm:px-0">
                  {/* Percentage and Progress Bar */}
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {Math.round(progressData.progressPercentage || 0)}%
                    </span>
                  </div>
                  <Progress
                    value={progressData.progressPercentage || 0}
                    className="w-full h-2"
                  />

                  {/* Current Action */}
                  <div className="text-center text-xs sm:text-sm text-muted-foreground">
                    {progressData.currentStep}
                  </div>

                  {/* Statistics */}
                  {progressData.processedRows > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">
                          {progressData.processedRows}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Processed
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-emerald-600">
                          {progressData.successCount}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Success
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-red-600">
                          {progressData.failureCount}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          Failed
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stop Button */}
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleStopImport}
                      disabled={stopImportMutation.isPending}
                      className="gap-2"
                    >
                      {stopImportMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Stop Import
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Real-time Errors */}
                  {progressData.recentErrors &&
                    progressData.recentErrors.length > 0 && (
                      <div className="w-full space-y-2 pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">
                            Recent Errors
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            Showing last {progressData.recentErrors.length}{" "}
                            errors
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-2 border border-border-color rounded-lg p-3 bg-muted/30">
                          {progressData.recentErrors.map((error, idx) => (
                            <Alert
                              key={error.errorGuid || idx}
                              variant="destructive"
                              className="p-3 text-xs"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              <AlertTitle className="text-xs">
                                Row {error.rowNumber} - {error.columnName}
                              </AlertTitle>
                              <AlertDescription className="text-xs">
                                {error.errorMessage}
                                {error.columnValue && (
                                  <span className="block mt-1 text-muted-foreground">
                                    Value: {error.columnValue}
                                  </span>
                                )}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {!progressData && (
                <p className="text-muted-foreground">Initializing import...</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === "complete" && renderResults()}
    </CustomContainer>
  );
}
