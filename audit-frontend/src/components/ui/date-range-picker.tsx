import * as React from "react";
import { format, isAfter, isBefore } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/common/use-auth-context";

export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (startDate?: Date, endDate?: Date) => void;
  disabled?: boolean;
  placeholder?: string;
  restricted?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  disabled = false,
  placeholder = "Select date range",
  restricted = false,
}: DateRangePickerProps) {
  // Get user context for date restrictions
  const { user } = useAuthContext();

  // State for tracking the current view month (for navigation)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startDate || new Date()
  );

  // State for tracking which date is being selected (start or end)
  const [selectingDate, setSelectingDate] = React.useState<"start" | "end">(
    "start"
  );

  // State for controlling year dropdown visibility
  const [isYearDropdownOpen, setIsYearDropdownOpen] = React.useState(false);

  // Reference for the dropdown for positioning and click detection
  const yearDropdownRef = React.useRef<HTMLDivElement>(null);

  // Generate years array from current year - 100 to current year + 10
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    return Array.from({ length: 111 }, (_, i) => currentYear - 100 + i);
  }, [currentYear]);

  // Handle clearing the date range with an additional button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRangeChange(undefined, undefined);
    setSelectingDate("start");
  };

  // Handle year selection
  const handleYearSelect = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setIsYearDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target as Node)
      ) {
        setIsYearDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isYearDropdownOpen]);

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsYearDropdownOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsYearDropdownOpen((prev) => !prev);
    }
  };

  // Create disabled function based on restricted prop and user date range
  const getDisabledDates = React.useMemo(() => {
    if (!restricted) {
      return disabled;
    }

    const userStartDate = user?.dtYearStartDate
      ? new Date(user.dtYearStartDate)
      : null;
    const userEndDate = user?.dtYearEndDate
      ? new Date(user.dtYearEndDate)
      : null;

    // If restricted is true but no dates available, disable all dates
    if (!userStartDate && !userEndDate) {
      return true;
    }

    // Return a function that checks if date is outside the allowed range
    return (date: Date) => {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      if (userStartDate) {
        const normalizedStart = new Date(userStartDate);
        normalizedStart.setHours(0, 0, 0, 0);
        if (isBefore(normalizedDate, normalizedStart)) {
          return true;
        }
      }

      if (userEndDate) {
        const normalizedEnd = new Date(userEndDate);
        normalizedEnd.setHours(0, 0, 0, 0);
        if (isAfter(normalizedDate, normalizedEnd)) {
          return true;
        }
      }

      return false;
    };
  }, [restricted, disabled, user?.dtYearStartDate, user?.dtYearEndDate]);

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Fix timezone issue by setting the time to noon
    const fixedDate = new Date(date);
    fixedDate.setHours(12, 0, 0, 0);

    if (selectingDate === "start") {
      // If selecting start date and there's already an end date
      // Make sure the new start date is before the existing end date
      if (endDate && isAfter(fixedDate, endDate)) {
        onRangeChange(fixedDate, undefined);
      } else {
        onRangeChange(fixedDate, endDate);
      }
      setSelectingDate("end");
    } else {
      // If selecting end date and it's before the start date,
      // swap them to maintain proper order
      if (startDate && isBefore(fixedDate, startDate)) {
        onRangeChange(fixedDate, startDate);
      } else {
        onRangeChange(startDate, fixedDate);
      }
      setSelectingDate("start");
    }
  };

  // Helper to format the date range display
  const formatDateRange = () => {
    if (!startDate && !endDate) return placeholder;

    if (startDate && endDate) {
      const sameDay = startDate.toDateString() === endDate.toDateString();
      if (sameDay) {
        return format(startDate, "PPP");
      }
      return `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`;
    }

    if (startDate && !endDate) {
      return `From ${format(startDate, "PPP")}`;
    }

    return `Until ${format(endDate as Date, "PPP")}`;
  };

  // Determine if a day should be highlighted as part of the range
  const isInRange = (day: Date) => {
    if (!startDate || !endDate) return false;

    // Normalize all dates to midnight for comparison
    const normalizedDay = new Date(day);
    normalizedDay.setHours(0, 0, 0, 0);

    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);

    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(0, 0, 0, 0);

    // Check if day is strictly between start and end (not including start or end)
    return normalizedDay > normalizedStart && normalizedDay < normalizedEnd;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            // Base styles
            "flex h-10 w-full min-w-0 rounded-md border border-border-color px-3 py-2 text-sm transition-colors",
            "hover:border-border-color",
            "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:border-border-color",
            "justify-start text-left font-normal",

            // Light mode styles
            "bg-white",
            "disabled:bg-white/50",

            // Dark mode styles
            "dark:bg-white/10",
            "dark:focus-visible:ring-border-color/20",
            "dark:disabled:bg-white/3",

            !startDate && !endDate && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="flex-1 truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border border-border-color shadow-md rounded-md">
        {/* Custom header with month and year display */}
        <div className="p-3 flex items-center justify-between border-b border-border bg-muted/20">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const prevMonth = new Date(currentMonth);
                prevMonth.setMonth(prevMonth.getMonth() - 1);
                setCurrentMonth(prevMonth);
              }}
              aria-label="Previous month"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </Button>
            <div className="text-sm font-semibold px-1.5 dark:text-foreground">
              {format(currentMonth, "MMMM")}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                const nextMonth = new Date(currentMonth);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCurrentMonth(nextMonth);
              }}
              aria-label="Next month"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
          <div className="relative" ref={yearDropdownRef}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-accent hover:text-accent-foreground dark:hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring dark:text-foreground"
              onClick={() => setIsYearDropdownOpen((prev) => !prev)}
              onKeyDown={handleKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isYearDropdownOpen}
            >
              {currentMonth.getFullYear()}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {/* Year dropdown */}
            {isYearDropdownOpen && (
              <div
                className="absolute top-full right-0 mt-1 z-50 max-h-56 w-24 overflow-auto rounded-md border border-border-color bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 dark:text-foreground"
                role="listbox"
              >
                {years.map((year) => (
                  <div
                    key={year}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center justify-center rounded-sm py-1.5 text-sm outline-none",
                      year === currentMonth.getFullYear()
                        ? "bg-accent text-accent-foreground dark:text-white"
                        : "hover:bg-accent hover:text-accent-foreground dark:hover:text-white"
                    )}
                    onClick={() => handleYearSelect(year)}
                    role="option"
                    aria-selected={year === currentMonth.getFullYear()}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Range selection helper text */}
        <div className="px-3 pt-2 text-xs text-muted-foreground dark:text-foreground/70">
          {selectingDate === "start" ? "Select start date" : "Select end date"}
        </div>

        {/* Calendar component */}
        <div className="p-2 [&_.rdp-month]:p-0 [&_.rdp-month_caption]:h-0 [&_.rdp-month_caption]:m-0 [&_.rdp-month_caption]:overflow-hidden">
          <Calendar
            mode="single"
            selected={selectingDate === "start" ? startDate : endDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            defaultMonth={startDate || currentMonth}
            disabled={getDisabledDates}
            onSelect={handleDateSelect}
            initialFocus
            modifiers={{
              range: (date) => isInRange(date),
              rangeStart: startDate
                ? (date) => {
                    const normalizedDate = new Date(date);
                    normalizedDate.setHours(0, 0, 0, 0);
                    const normalizedStartDate = new Date(startDate);
                    normalizedStartDate.setHours(0, 0, 0, 0);
                    return (
                      normalizedDate.getTime() === normalizedStartDate.getTime()
                    );
                  }
                : undefined,
              rangeEnd: endDate
                ? (date) => {
                    const normalizedDate = new Date(date);
                    normalizedDate.setHours(0, 0, 0, 0);
                    const normalizedEndDate = new Date(endDate);
                    normalizedEndDate.setHours(0, 0, 0, 0);
                    return (
                      normalizedDate.getTime() === normalizedEndDate.getTime()
                    );
                  }
                : undefined,
            }}
            modifiersClassNames={{
              range:
                "bg-primary/15 text-foreground dark:text-foreground hover:bg-primary/25",
              rangeStart:
                "bg-primary text-primary-foreground rounded-l-md dark:text-white hover:bg-primary hover:text-primary-foreground",
              rangeEnd:
                "bg-primary text-primary-foreground rounded-r-md dark:text-white hover:bg-primary hover:text-primary-foreground",
            }}
            classNames={{
              // Remove special coloring/selection styling for today's date
              today: cn("font-normal"),
              caption: "hidden", // Hide the built-in caption completely
              caption_label: "hidden",
              nav: "hidden", // Hide the navigation buttons
              head_row: "flex mb-2 mt-1",
              head_cell:
                "rounded-md w-9 font-medium text-[0.8rem] text-muted-foreground dark:text-foreground/70 px-1",
              row: "flex w-full mt-1 mb-1",
              cell: "h-9 w-9 p-0 text-center text-sm relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 px-0.5 dark:text-foreground [&:has(.rdp-day_range)]:bg-primary/10 [&:has(.rdp-day_range)]:dark:bg-primary/20",
              day: "h-9 w-9 p-0 flex items-center justify-center aria-selected:opacity-100 rounded-md hover:bg-muted/50 dark:hover:text-foreground dark:text-foreground/90 data-[range-start=true]:shadow-md data-[range-end=true]:shadow-md",
              table: "w-full border-collapse space-y-1 px-2 py-1",
            }}
          />
        </div>
        {/* Clear button */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={handleClear}
            type="button"
          >
            Clear Range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
