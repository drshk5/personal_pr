import React from "react";
import { Minus } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

interface IndeterminateCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
  "aria-label"?: string;
}

export const IndeterminateCheckbox: React.FC<IndeterminateCheckboxProps> = ({
  checked,
  indeterminate = false,
  onCheckedChange,
  disabled,
  title,
  "aria-label": ariaLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (onCheckedChange) {
      if (indeterminate) {
        onCheckedChange(false);
      } else {
        onCheckedChange(!checked);
      }
    }
  };

  if (indeterminate) {
    return (
      <div
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          onClick={handleClick}
          className={`h-5 w-5 rounded-md flex items-center justify-center bg-primary border-[3px] border-primary shadow-md ${
            disabled ? "" : "cursor-pointer"
          }`}
          title={title}
          aria-label={ariaLabel}
        >
          <Minus className="h-3 w-3 text-white stroke-4" />
        </div>
      </div>
    );
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    />
  );
};
