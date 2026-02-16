import * as React from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string;
  onChange: (time?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  use24HourFormat?: boolean;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Pick a time",
  use24HourFormat = false,
}: TimePickerProps) {
  const [selectedAmPm, setSelectedAmPm] = React.useState<"AM" | "PM">("AM");

  // Handle time selection
  const handleTimeChange = (
    hour: string,
    minute: string,
    ampm?: "AM" | "PM"
  ) => {
    if (!use24HourFormat && ampm) {
      // Convert 12-hour format to 24-hour format for storing
      let hourNum = parseInt(hour, 10);
      if (ampm === "PM" && hourNum < 12) {
        hourNum += 12;
      } else if (ampm === "AM" && hourNum === 12) {
        hourNum = 0;
      }
      onChange(`${hourNum.toString().padStart(2, "0")}:${minute}`);
    } else {
      onChange(`${hour}:${minute}`);
    }
  };

  // Handle AM/PM selection
  const handleAmPmChange = (ampm: "AM" | "PM") => {
    setSelectedAmPm(ampm);
    handleTimeChange(display12HourFormat(selectedHour), selectedMinute, ampm);
  };

  // Handle clearing the time with an additional button
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  // Convert 24-hour format to 12-hour display format
  const display12HourFormat = (hour24: string): string => {
    const hourNum = parseInt(hour24, 10);
    if (hourNum === 0) return "12"; // 00:00 -> 12 AM
    if (hourNum > 12) return (hourNum - 12).toString().padStart(2, "0"); // 13-23 -> 01-11 PM
    return hourNum.toString().padStart(2, "0"); // 01-12 -> 01-12 AM/PM
  };

  // Generate hours for the time picker (12 or 24 hour format)
  const hours = React.useMemo(() => {
    if (use24HourFormat) {
      return Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      );
    } else {
      return Array.from({ length: 12 }, (_, i) =>
        i === 0 ? "12" : i.toString().padStart(2, "0")
      );
    }
  }, [use24HourFormat]);

  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  // Extract hour and minute from the current value
  const [selectedHour, selectedMinute] = React.useMemo(() => {
    if (!value) return ["00", "00"];
    const [hour = "00", minute = "00"] = value.split(":");
    const hourNum = parseInt(hour, 10);
    let ampm: "AM" | "PM" = "AM";

    if (hourNum >= 12) {
      ampm = "PM";
    }

    // Initialize the AM/PM state based on the current value
    if (!use24HourFormat) {
      setSelectedAmPm(ampm);
    }

    return [hour, minute];
  }, [value, use24HourFormat]);

  // For display purposes
  const displayHour = React.useMemo(() => {
    if (!value) return "";
    if (use24HourFormat) {
      return selectedHour;
    } else {
      return display12HourFormat(selectedHour);
    }
  }, [selectedHour, use24HourFormat, value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            // Base styles
            "flex h-10 w-full min-w-0 rounded-md border border-border-color px-3 py-2 text-sm transition-colors",
            "hover:border-border-color hover:bg-muted/50",
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

            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? (
            <span>
              {use24HourFormat
                ? `${selectedHour}:${selectedMinute}`
                : `${displayHour}:${selectedMinute} ${selectedAmPm}`}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border border-border shadow-md rounded-md">
        <div className="p-3 flex justify-center">
          <div
            className={cn(
              "grid gap-3",
              use24HourFormat ? "grid-cols-2" : "grid-cols-3"
            )}
          >
            {/* Hours column */}
            <div
              className="flex flex-col h-40 overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="text-xs mb-1 text-center text-muted-foreground">
                Hour
              </div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className={cn(
                    "px-2 py-1.5 text-sm text-center cursor-pointer transition-colors rounded-sm",
                    (
                      use24HourFormat
                        ? hour === selectedHour
                        : hour === display12HourFormat(selectedHour)
                    )
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted dark:hover:bg-white/10 bg-transparent"
                  )}
                  onClick={() =>
                    handleTimeChange(hour, selectedMinute, selectedAmPm)
                  }
                >
                  {hour}
                </div>
              ))}
            </div>

            {/* Minutes column */}
            <div
              className="flex flex-col h-40 overflow-y-auto px-2"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="text-xs mb-1 text-center text-muted-foreground">
                Minute
              </div>
              {minutes.map((minute) => (
                <div
                  key={minute}
                  className={cn(
                    "px-2 py-1.5 text-sm text-center cursor-pointer transition-colors rounded-sm",
                    minute === selectedMinute
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted dark:hover:bg-white/10 bg-transparent"
                  )}
                  onClick={() =>
                    handleTimeChange(
                      use24HourFormat
                        ? selectedHour
                        : display12HourFormat(selectedHour),
                      minute,
                      selectedAmPm
                    )
                  }
                >
                  {minute}
                </div>
              ))}
            </div>

            {/* AM/PM column */}
            {!use24HourFormat && (
              <div
                className="flex flex-col h-40 overflow-y-auto pl-2"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                <div className="text-xs mb-1 text-center text-muted-foreground">
                  AM/PM
                </div>
                {["AM", "PM"].map((ampm) => (
                  <div
                    key={ampm}
                    className={cn(
                      "px-2 py-1.5 text-sm text-center cursor-pointer transition-colors rounded-sm",
                      ampm === selectedAmPm
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted dark:hover:bg-white/10 bg-transparent"
                    )}
                    onClick={() => handleAmPmChange(ampm as "AM" | "PM")}
                  >
                    {ampm}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear button */}
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            type="button"
          >
            Clear Time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
