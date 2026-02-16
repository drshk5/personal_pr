import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadSLAIndicatorProps {
  isSLABreached?: boolean;
  status: string;
}

const LeadSLAIndicator: React.FC<LeadSLAIndicatorProps> = ({
  isSLABreached,
  status,
}) => {
  if (isSLABreached == null) return null;
  if (status === "Converted" || status === "Unqualified") return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isSLABreached ? (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <ShieldAlert className="h-3 w-3" />
              SLA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <ShieldCheck className="h-3 w-3" />
              OK
            </span>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isSLABreached
              ? "SLA breached — this lead needs immediate attention"
              : "Within SLA compliance"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LeadSLAIndicator;
