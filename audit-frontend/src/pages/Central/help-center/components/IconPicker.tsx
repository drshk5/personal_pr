import { useState } from "react";

import { cn } from "@/lib/utils";
import { getIconByName } from "@/lib/icon-map";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Common icons for help center categories
const POPULAR_ICONS = [
  "BookOpen",
  "HelpCircle",
  "PartyPopper",
  "Lightbulb",
  "MessageSquare",
  "Video",
  "FileText",
  "Settings",
  "Users",
  "Calculator",
  "Database",
  "BarChart",
  "ShieldCheck",
  "Clock",
  "Bell",
  "Mail",
  "Phone",
  "Globe",
  "Home",
  "Package",
  "Tag",
  "TrendingUp",
  "Zap",
  "Award",
  "Star",
];

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const SelectedIcon = value ? getIconByName(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start"
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon className="mr-2 h-4 w-4" />
              {value}
            </>
          ) : (
            "Select icon..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-2" align="start">
        <div className="grid grid-cols-4 gap-2">
          {POPULAR_ICONS.map((iconName) => {
            const Icon = getIconByName(iconName);
            const isSelected = value === iconName;

            if (!Icon) return null;

            return (
              <button
                key={iconName}
                type="button"
                onClick={() => {
                  onChange(iconName);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted transition-colors",
                  isSelected && "bg-muted ring-2 ring-primary"
                )}
                title={iconName}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
