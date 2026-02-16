import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { cn } from "@/lib/utils";

export type ReminderRecipient =
  | "for myself"
  | "for assignees"
  | "for everyone involved in this task";

export interface ReminderPickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
  onRecipientChange?: (recipient: ReminderRecipient) => void;
  recipient?: ReminderRecipient;
  disabled?: boolean;
  placeholder?: string;
  restrictToMyself?: boolean; // When true, only show "For myself" option
}

// Generate time slots with 15-minute intervals
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      slots.push(format(date, "h:mm a"));
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export function ReminderPicker({
  value,
  onChange,
  onRecipientChange,
  recipient = "for everyone involved in this task",
  disabled = false,
  placeholder = "Set reminder date and time",
  restrictToMyself = false,
}: ReminderPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    value || new Date()
  );
  const [isYearDropdownOpen, setIsYearDropdownOpen] = React.useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>(() => {
    if (value) {
      // Round up to next 15 minutes
      const roundedDate = new Date(value);
      const minutes = Math.ceil(roundedDate.getMinutes() / 15) * 15;
      const hours =
        minutes >= 60 ? roundedDate.getHours() + 1 : roundedDate.getHours();
      roundedDate.setHours(hours, minutes % 60, 0, 0);
      return format(roundedDate, "h:mm a");
    }
    // Default to current time rounded up to next 15 minutes
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    // Only add an hour if rounded minutes would be 60 or more
    if (roundedMinutes >= 60) {
      now.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      now.setHours(now.getHours(), roundedMinutes, 0, 0);
    }
    return format(now, "h:mm a");
  });

  const yearDropdownRef = React.useRef<HTMLDivElement>(null);
  const yearListRef = React.useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    return Array.from({ length: 121 }, (_, i) => currentYear - 100 + i);
  }, [currentYear]);

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

  // Update selectedTimeSlot when value changes
  React.useEffect(() => {
    if (value) {
      // Round up to next 15 minutes to match available time slots
      const roundedDate = new Date(value);
      const minutes = Math.ceil(roundedDate.getMinutes() / 15) * 15;
      roundedDate.setMinutes(minutes, 0, 0);
      setSelectedTimeSlot(format(roundedDate, "h:mm a"));
    }
  }, [value]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange(undefined);
    // Reset to current time rounded up to next 15 minutes
    const now = new Date();
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    if (minutes >= 60) {
      now.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      now.setHours(now.getHours(), minutes, 0, 0);
    }
    const defaultTimeSlot = format(now, "h:mm a");
    setSelectedTimeSlot(defaultTimeSlot);
    setOpen(false);
  };
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsYearDropdownOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsYearDropdownOpen((prev) => !prev);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);

    // Parse the time slot
    const [time, period] = timeSlot.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;

    if (period === "PM" && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === "AM" && hours === 12) {
      hour24 = 0;
    }

    // Use existing date or current date
    const baseDate = value || new Date();
    const newDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour24,
      minutes,
      0
    );
    onChange(newDate);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // If we have a selected time, preserve it
      if (selectedTimeSlot) {
        const [time, period] = selectedTimeSlot.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let hour24 = hours;

        if (period === "PM" && hours !== 12) {
          hour24 = hours + 12;
        } else if (period === "AM" && hours === 12) {
          hour24 = 0;
        }

        const newDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          hour24,
          minutes,
          0
        );
        onChange(newDate);
      } else {
        // Set default time to current time rounded up to next 15 minutes
        const now = new Date();
        const currentMinutes = now.getMinutes();
        const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;

        let finalHours = now.getHours();
        let finalMinutes = roundedMinutes;

        // Only add an hour if rounded minutes would be 60 or more
        if (roundedMinutes >= 60) {
          finalHours = now.getHours() + 1;
          finalMinutes = 0;
        }

        const defaultTimeSlot = new Date(now);
        defaultTimeSlot.setHours(finalHours, finalMinutes, 0, 0);
        setSelectedTimeSlot(format(defaultTimeSlot, "h:mm a"));

        const newDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          finalHours,
          finalMinutes,
          0
        );
        onChange(newDate);
      }
    } else {
      onChange(date);
    }
  };

  // Find the index of selected time slot for scrolling
  const selectedTimeIndex = timeSlots.indexOf(selectedTimeSlot);
  const timeListRef = React.useRef<HTMLDivElement>(null);

  // Scroll to selected time when popover opens
  React.useEffect(() => {
    if (open && timeListRef.current && selectedTimeIndex >= 0) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          const timeElement = timeListRef.current?.querySelector(
            `[data-time-slot="${selectedTimeIndex}"]`
          );
          if (timeElement) {
            timeElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      });
    }
  }, [selectedTimeIndex, open]);

  // Set today's date and current time when opening for the first time without a value
  React.useEffect(() => {
    if (open && !value) {
      // First clear everything to reset state
      setCurrentMonth(new Date());
      setSelectedTimeSlot("");

      // Then set current date/time after a brief moment
      requestAnimationFrame(() => {
        const now = new Date();
        const roundedMinutes = Math.ceil(now.getMinutes() / 15) * 15;

        let finalHours = now.getHours();
        let finalMinutes = roundedMinutes;

        // Only add an hour if rounded minutes would be 60 or more
        if (roundedMinutes >= 60) {
          finalHours = now.getHours() + 1;
          finalMinutes = 0;
        }

        const todayWithTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          finalHours,
          finalMinutes,
          0
        );

        const defaultTimeSlot = format(todayWithTime, "h:mm a");

        // Set current month to today to ensure calendar shows current month
        setCurrentMonth(todayWithTime);
        setSelectedTimeSlot(defaultTimeSlot);
        onChange(todayWithTime);

        // Additional scroll trigger with requestAnimationFrame for better reliability
        requestAnimationFrame(() => {
          setTimeout(() => {
            const index = timeSlots.indexOf(defaultTimeSlot);
            if (timeListRef.current && index >= 0) {
              const timeElement = timeListRef.current.querySelector(
                `[data-time-slot="${index}"]`
              );
              if (timeElement) {
                timeElement.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }
            }
          }, 400);
        });
      });
    }
  }, [open, value, onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "flex h-10 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm transition-colors",
            "border-border-color hover:border-border-color",
            "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-white/50 disabled:border-border-color",
            "dark:bg-muted dark:border-border-color dark:hover:border-border-color",
            "dark:focus-visible:border-border-color dark:focus-visible:ring-border-color/20",
            "dark:disabled:bg-white/5 dark:disabled:border-border-color",
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <div className="flex items-center gap-2">
              <span>
                {format(
                  new Date(
                    value.getFullYear(),
                    value.getMonth(),
                    value.getDate(),
                    12
                  ),
                  "PPP"
                )}
              </span>
              <Clock className="h-3 w-3" />
              <span>{format(value, "h:mm a")}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border border-border shadow-md rounded-md z-50">
        <div className="flex flex-col">
          {/* Header with title and clear button */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold">Set Reminder</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleClear}
              type="button"
            >
              Clear Reminder
            </Button>
          </div>

          {/* Recipient Selection Dropdown */}
          {onRecipientChange && !restrictToMyself && (
            <div className="p-3 border-b border-border">
              <Select
                value={recipient}
                onValueChange={(value) =>
                  onRecipientChange(value as ReminderRecipient)
                }
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select reminder recipient" />
                </SelectTrigger>
                <SelectContent className="z-100" sideOffset={4}>
                  <SelectItem value="for myself">For myself</SelectItem>
                  <SelectItem value="for assignees">For assignees</SelectItem>
                  <SelectItem value="for everyone involved in this task">
                    For everyone involved in this Task
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show fixed "For myself" when restricted */}
          {onRecipientChange && restrictToMyself && (
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between rounded-lg border border-input bg-muted/50 px-3 py-2">
                <span className="text-sm text-foreground">For myself</span>
              </div>
            </div>
          )}

          {/* Calendar and Time Picker */}
          <div className="flex">
            {/* Calendar Section - Reusing DatePicker calendar logic */}
            <div className="flex-1 border-r border-border min-w-70">
              {/* Custom header with month and year display - same as DatePicker */}
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

                  {/* Year dropdown - same as DatePicker */}
                  {isYearDropdownOpen && (
                    <div
                      ref={yearListRef}
                      className="absolute top-full right-0 mt-1 z-50 max-h-56 w-24 overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                      role="listbox"
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

              {/* Calendar component - same as DatePicker */}
              <div className="p-2 [&_.rdp-month]:p-0 [&_.rdp-month_caption]:h-0 [&_.rdp-month_caption]:m-0 [&_.rdp-month_caption]:overflow-hidden">
                <Calendar
                  mode="single"
                  selected={value}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  defaultMonth={value || currentMonth}
                  disabled={(date) => {
                    // Disable all dates before today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || disabled;
                  }}
                  onSelect={(date) => {
                    if (date) {
                      // Fix timezone issue by setting the time to noon (same as DatePicker)
                      const fixedDate = new Date(date);
                      fixedDate.setHours(12, 0, 0, 0);
                      handleDateSelect(fixedDate);
                    } else {
                      handleDateSelect(undefined);
                    }
                  }}
                  initialFocus
                  classNames={{
                    today: cn(
                      "bg-primary/10 font-semibold ring-1 ring-primary/50 hover:bg-primary/20",
                      "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:font-bold data-[selected=true]:ring-2"
                    ),
                    caption: "hidden",
                    caption_label: "hidden",
                    nav: "hidden",
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
            </div>

            {/* Time Selection Section */}
            <div className="w-56 bg-muted/5 border-l border-border relative">
              <div className="p-3 h-87.5 flex flex-col">
                {/* Display current selected time at top */}
                <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b border-border">
                  <span className="text-sm font-medium">
                    {selectedTimeSlot || "12:00 PM"}
                  </span>
                </div>

                {/* Scrollable time list */}
                <div
                  className="flex-1 relative overflow-y-auto overflow-x-hidden"
                  ref={timeListRef}
                  onWheel={(e) => {
                    e.currentTarget.scrollBy({
                      top: e.deltaY,
                      behavior: "smooth",
                    });
                  }}
                >
                  <div className="py-1">
                    {timeSlots.map((slot, index) => {
                      // Check if this time slot is in the past
                      const isDisabled = (() => {
                        const now = new Date();
                        const selectedDate = value || new Date();
                        const [time, period] = slot.split(" ");
                        const [hours, minutes] = time.split(":").map(Number);
                        let hour24 = hours;

                        if (period === "PM" && hours !== 12) {
                          hour24 = hours + 12;
                        } else if (period === "AM" && hours === 12) {
                          hour24 = 0;
                        }

                        const slotTime = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate(),
                          hour24,
                          minutes,
                          0
                        );

                        // Compare dates (year, month, day)
                        const nowDate = new Date(
                          now.getFullYear(),
                          now.getMonth(),
                          now.getDate()
                        );
                        const slotDate = new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth(),
                          selectedDate.getDate()
                        );

                        // If the selected date is today, disable times before now
                        if (nowDate.getTime() === slotDate.getTime()) {
                          return slotTime < now;
                        }
                        // If the selected date is in the past, disable all times
                        if (slotDate < nowDate) {
                          return true;
                        }
                        // If the selected date is in the future, enable all times
                        return false;
                      })();

                      return (
                        <button
                          key={slot}
                          type="button"
                          data-time-slot={index}
                          disabled={isDisabled}
                          className={cn(
                            "w-full px-3 py-2 text-sm transition-colors rounded-md text-left",
                            isDisabled
                              ? "cursor-not-allowed opacity-50 text-muted-foreground"
                              : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                            "focus:outline-none focus:ring-1 focus:ring-ring",
                            !isDisabled &&
                              selectedTimeSlot === slot &&
                              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-medium"
                          )}
                          onClick={() =>
                            !isDisabled && handleTimeSlotSelect(slot)
                          }
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
