import { z } from "zod";
import type { TaskColumnMapping } from "@/types/task/task-import";

/**
 * Validation schema for task column mapping
 * Based on TaskColumnMappingDto from backend
 */
export const taskColumnMappingSchema = z.object({
  taskNo: z.string().optional(),
  taskTitle: z.string().optional(),
  taskDesc: z.string().optional(),
  startDate: z.string().optional(),
  taskBoard: z.string().optional(),
  boardSection: z.string().optional(),
  subModule: z.string().optional(),
  taskTags: z.string().optional(),
  taskStartTime: z.string().optional(),
  taskEndTime: z.string().optional(),
  status: z.string().optional(),
  userName: z.string().optional(),
  dueDate: z.string().optional(),
  ticketKey: z.string().optional(),
  ticketUrl: z.string().optional(),
  ticketSource: z.string().optional(),
  priority: z.string().optional(),
});

/**
 * Validation for required fields in task import
 */
export const validateRequiredMappings = (
  mapping: TaskColumnMapping
) => {
  const requiredFields = [
    "taskBoard",
    "userName",
    "taskNo",
    "taskTitle",
    "taskDesc",
    "startDate",
    "boardSection",
    "status",
  ];

  const missingFields = requiredFields.filter(
    (field) => {
      const value = mapping[field as keyof TaskColumnMapping];
      return !value || value === "none";
    }
  );

  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      message: `Please map the following required fields: ${missingFields.join(", ")}`,
    };
  }

  return {
    isValid: true,
    missingFields: [],
    message: "All required fields are mapped",
  };
};

/**
 * File validation for Excel import
 * Matches backend validation: .xlsx or .xls, max 10MB
 */
export const validateExcelFile = (file: File) => {
  const validTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  const validExtensions = [".xlsx", ".xls"];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));

  const maxSize = 10 * 1024 * 1024; // 10MB

  // Check file extension
  if (!validExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      message: "Invalid file format. Only .xlsx and .xls files are supported.",
    };
  }

  // Check MIME type
  if (!validTypes.includes(file.type) && file.type !== "") {
    return {
      isValid: false,
      message: "Invalid file type. Please upload an Excel file (.xlsx or .xls)",
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: "File size exceeds limit of 10MB",
    };
  }

  return {
    isValid: true,
    message: "File is valid",
  };
};
