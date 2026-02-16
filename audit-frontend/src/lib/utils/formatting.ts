import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts "14:30" to "2:30 PM"
export function formatTimeToAmPm(time?: string | null): string {
  if (!time) return "-";

  try {
    const [hours, minutes] = time.split(":").map((part) => parseInt(part, 10));
    if (isNaN(hours) || isNaN(minutes)) return time;

    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return time;
  }
}

export function formatDate(
  dateString: string,
  includeTime: boolean = false
): string {
  try {
    const formatString = includeTime ? "MMM d, yyyy, h:mm a" : "MMM d, yyyy";
    return format(new Date(dateString), formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Sanitizes decimal input by removing non-numeric characters except decimal point.
 * @param value - The input string to sanitize
 * @param maxDecimalPlaces - Maximum number of decimal places allowed (optional)
 * @param allowNegative - Whether to allow negative numbers (default: false)
 * @returns Sanitized string with only digits and one decimal point
 */
export function sanitizeDecimalInput(
  value: string,
  maxDecimalPlaces?: number,
  allowNegative: boolean = false
): string {
  const pattern = allowNegative ? /[^\d.-]/g : /[^\d.]/g;
  const cleaned = value.replace(pattern, "");

  // Handle negative sign - only allow at the beginning
  const hasNegative = allowNegative && cleaned.startsWith("-");
  const absoluteValue = hasNegative ? cleaned.slice(1) : cleaned;

  const [integerPart = "", ...decimalParts] = absoluteValue.split(".");
  let decimals = decimalParts.join("");

  // Limit decimal places if maxDecimalPlaces is specified
  if (maxDecimalPlaces !== undefined && decimals.length > maxDecimalPlaces) {
    decimals = decimals.slice(0, maxDecimalPlaces);
  }

  if (absoluteValue.includes(".")) {
    return `${hasNegative ? "-" : ""}${integerPart}.${decimals}`;
  }

  return `${hasNegative ? "-" : ""}${integerPart}`;
}

/**
 * Sanitizes whole number input by removing all non-numeric characters
 * @param value - The input string to sanitize
 * @returns Sanitized string with only digits
 */
export function sanitizeWholeNumberInput(value: string): string {
  return value.replace(/[^0-9]/g, "");
}
