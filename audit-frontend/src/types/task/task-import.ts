export interface TaskColumnMapping {
  taskNo?: string;
  taskTitle?: string;
  taskDesc?: string;
  startDate?: string;
  taskBoard?: string;
  boardSection?: string;
  subModule?: string;
  taskTags?: string;
  taskStartTime?: string;
  taskEndTime?: string;
  status?: string;
  userName?: string;
  dueDate?: string;
  ticketKey?: string;
  ticketUrl?: string;
  ticketSource?: string;
  priority?: string;
}

export interface ExcelPreviewData {
  columnHeaders: string[];
  sampleData: Record<string, string>[];
  totalRows: number;
}

export interface ImportValidationError {
  rowNumber: number;
  fieldName?: string;
  errorMessage: string;
  severity: string;
  invalidValue?: string;
}

export interface ImportSummary {
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  failedRows: number;
  errorMessages: string[];
  rowErrors: ImportError[];
  boardsCreated: number;
  sectionsCreated: number;
  tagsCreated: number;
  timersCreated: number;
  checklistItemsCreated: number;
  processingTime: string;
  importStartedAt: string;
  importCompletedAt: string;
}

export interface ImportInitiatedResponse {
  importId: string;
  totalRows: number;
  status: string;
  estimatedCompletion: string;
}

export interface ImportProgress {
  importId: string;
  status: "Initiated" | "Processing" | "Completed" | "Failed";
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  progressPercentage: number;
  currentStep: string;
  startTime: string;
  estimatedCompletion?: string;
  result?: ImportResult;
  recentErrors?: ImportError[];
}

export interface ImportResult {
  success: boolean;
  message: string;
  summary: ImportSummary;
  createdTasks: unknown[];
  validationErrors: ImportValidationError[];
  failedRows: number[];
  detailedErrors: string[];
}

export interface ImportError {
  errorGuid: string;
  importGuid: string;
  rowNumber: number;
  columnName: string;
  columnValue?: string;
  errorCode: string;
  errorMessage: string;
  createdOn: string;
}

export interface TaskImportRequest {
  file: File;
  columnMapping?: TaskColumnMapping;
}

export type ImportStatus = "Initiated" | "Processing" | "Completed" | "Failed";

export type ErrorSeverity = "Error" | "Warning" | "Info";

export interface ImportStatusDto {
  importId: string;
  fileName: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "PARTIAL";
  totalRows: number;
  successCount: number;
  failureCount: number;
  percentageComplete: number;
  startedOn?: string;
  completedOn?: string;
  processingTime?: string;
  estimatedRowsPerSecond: number;
  message: string;
  canCancel: boolean;
  isBackgroundProcessing: boolean;
}

export interface ImportSummaryItem {
  importId: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: string;
  createdOn: string;
  startedOn?: string;
  completedOn?: string;
  processingTime?: string;
}

export interface ProjectImportStats {
  projectName: string;
  tasksImported: number;
  lastImported: string;
}

export interface DailyImportStats {
  date: string;
  importsCount: number;
  tasksCreated: number;
  failedRows: number;
}

export interface TaskImportStatistics {
  importList: ImportSummaryItem[];
  importIds: string[];
  importNames: string[];
  data: ImportSummaryItem[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  hasPrevious?: boolean;
  hasNext?: boolean;
}
