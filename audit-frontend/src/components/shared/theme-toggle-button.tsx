import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface ThemeToggleButtonProps {
  onClick?: () => void;
  tooltipText?: string;
  className?: string;
}

export function ThemeToggleButton({
  onClick,
  tooltipText = "Customize Theme",
  className,
}: ThemeToggleButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={className || "h-9 w-9 hover:bg-primary"}
      title={tooltipText}
    >
      <Palette className="size-5" />
    </Button>
  );
}
