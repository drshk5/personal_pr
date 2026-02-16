import * as React from "react";
import { format, isBefore, isAfter } from "date-fns";
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

export interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  disabled?: boolean | ((date: Date) => boolean);
  placeholder?: string;
  restricted?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Pick a date",
  restricted = false,
  className,
}: DatePickerProps) {
  // Get user context for date restrictions
  const { user } = useAuthContext();

  // State for controlling the popover open/close
  const [open, setOpen] = React.useState(false);

  // State for tracking the current view month (for navigation)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    // Make sure we use the value if provided, or current date otherwise
    return value ? new Date(value) : new Date();
  });

  // State for controlling year dropdown visibility
  const [isYearDropdownOpen, setIsYearDropdownOpen] = React.useState(false);

  // Reference for the dropdown for positioning and click detection
  const yearDropdownRef = React.useRef<HTMLDivElement>(null);

  // Reference for the dropdown container to enable scrolling
  const yearListRef = React.useRef<HTMLDivElement>(null);

  // Generate years array from current year - 100 to current year + 20
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => currentYear - 100 + i);
  }, [currentYear]);

  // Handle clearing the date with an additional button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setOpen(false);
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

  // Keep currentMonth in sync with value changes
  React.useEffect(() => {
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  // Scroll to selected year when dropdown opens
  React.useEffect(() => {
    if (isYearDropdownOpen && yearListRef.current) {
      const selectedYear = currentMonth.getFullYear();
      const selectedYearElement = yearListRef.current.querySelector(
        `[data-year="${selectedYear}"]`
      ) as HTMLElement;

      if (selectedYearElement) {
        selectedYearElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [isYearDropdownOpen, currentMonth]);

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

      // If original disabled prop is a function, also check it
      if (typeof disabled === "function") {
        return disabled(date);
      }

      return false;
    };
  }, [restricted, disabled, user?.dtYearStartDate, user?.dtYearEndDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            // Base styles
            "flex h-10 w-full min-w-0 rounded-md border border-border-color px-3 py-2 text-sm transition-colors",
            "hover:border-border-color hover:bg-muted/50",
            "focus-visible:outline-none focus-visible:border-border-color ",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:border-border-color",
            "justify-start text-left font-normal",

            // Light mode styles
            "bg-white",
            "disabled:bg-white/50",

            // Dark mode styles
            "dark:bg-white/10",
            "dark:focus-visible:ring-border-color/20",
            "dark:disabled:bg-white/3",

            !value && "text-muted-foreground",
            className
          )}
          disabled={typeof disabled === "boolean" ? disabled : false}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(
              new Date(
                value.getFullYear(),
                value.getMonth(),
                value.getDate(),
                12
              ),
              "PPP"
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border border-border-color shadow-md rounded-md">
        {/* Custom header with month and year display */}
        <div className="p-3 flex items-center justify-between border-b border-border-color bg-muted/20">
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
            <div className="text-sm font-semibold px-1.5">
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
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                ref={yearListRef}
                className="absolute top-full right-0 mt-1 z-50 max-h-56 w-24 overflow-y-auto overflow-x-hidden rounded-md bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                role="listbox"
                style={{ overscrollBehavior: "contain" }}
                onWheel={(e) => {
                  e.stopPropagation();
                }}
              >
                {years.map((year) => (
                  <div
                    key={year}
                    data-year={year}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center justify-center rounded-sm py-1.5 text-sm outline-none",
                      year === currentMonth.getFullYear()
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
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
        {/* Calendar component */}
        <div className="p-2 [&_.rdp-month]:p-0 [&_.rdp-month_caption]:h-0 [&_.rdp-month_caption]:m-0 [&_.rdp-month_caption]:overflow-hidden">
          <Calendar
            mode="single"
            selected={value}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            defaultMonth={value || currentMonth}
            disabled={getDisabledDates}
            onSelect={(date) => {
              if (date) {
                // Fix timezone issue by setting the time to noon
                const fixedDate = new Date(date);
                fixedDate.setHours(12, 0, 0, 0);
                onChange(fixedDate);
                setOpen(false); // Close the popover after selecting a date
              }
              // Don't clear the date when clicking the same date again (date is undefined in that case)
              // The user can use the "Clear Date" button if they want to clear it
            }}
            initialFocus
            classNames={{
              today: cn(
                "bg-primary/10 font-semibold hover:bg-primary/20",
                "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:font-bold"
              ),
              caption: "hidden", // Hide the built-in caption completely
              caption_label: "hidden",
              nav: "hidden", // Hide the navigation buttons
              head_row: "flex mb-2 mt-1",
              head_cell:
                "rounded-md w-9 font-medium text-[0.8rem] text-muted-foreground px-1",
              row: "flex w-full mt-1 mb-1",
              cell: "h-9 w-9 p-0 text-center text-sm relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 px-0.5",
              day: cn(
                "h-9 w-9 p-0 flex items-center justify-center rounded-md hover:bg-muted/50",
                "aria-selected:bg-primary aria-selected:text-white aria-selected:hover:bg-primary aria-selected:hover:text-white"
              ),
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
            Clear Date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
