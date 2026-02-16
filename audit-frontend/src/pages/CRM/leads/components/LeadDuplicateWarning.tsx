import React from "react";
import { Copy, AlertCircle } from "lucide-react";
import type { LeadDuplicateDto } from "@/types/CRM/lead";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface LeadDuplicateWarningProps {
  hasDuplicates?: boolean;
  duplicates?: LeadDuplicateDto[];
  compact?: boolean;
}

function getMatchReasonLabel(reason: string): string {
  switch (reason) {
    case "email_exact":
      return "Exact email match";
    case "name_fuzzy":
      return "Similar name";
    case "phone_match":
      return "Phone match";
    default:
      return reason;
  }
}

const LeadDuplicateWarning: React.FC<LeadDuplicateWarningProps> = ({
  hasDuplicates,
  duplicates,
  compact = true,
}) => {
  if (!hasDuplicates) return null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 cursor-pointer">
              <Copy className="h-3 w-3" />
              Dup
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs font-medium mb-1">Potential duplicates found</p>
            {duplicates && duplicates.length > 0 ? (
              <ul className="text-xs space-y-1">
                {duplicates.slice(0, 3).map((dup) => (
                  <li key={dup.strLeadGUID} className="flex items-center gap-1">
                    <span>
                      {dup.strFirstName} {dup.strLastName}
                    </span>
                    <span className="text-muted-foreground">
                      ({Math.round(dup.dblMatchScore)}%)
                    </span>
                  </li>
                ))}
                {duplicates.length > 3 && (
                  <li className="text-muted-foreground">
                    +{duplicates.length - 3} more
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                Click to view and merge duplicates
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded view for detail/form page
  return (
    <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
          Potential Duplicates Detected
        </h4>
      </div>

      {duplicates && duplicates.length > 0 ? (
        <div className="space-y-2">
          {duplicates.map((dup) => (
            <div
              key={dup.strLeadGUID}
              className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-md px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {dup.strFirstName} {dup.strLastName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {dup.strEmail}
                </span>
                {dup.strCompanyName && (
                  <span className="text-muted-foreground text-xs">
                    - {dup.strCompanyName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getMatchReasonLabel(dup.strMatchReason)}
                </Badge>
                <span
                  className={`text-xs font-medium ${
                    dup.dblMatchScore >= 90
                      ? "text-red-600 dark:text-red-400"
                      : dup.dblMatchScore >= 70
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {Math.round(dup.dblMatchScore)}% match
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Duplicates detected. Review in the lead detail view.
        </p>
      )}
    </div>
  );
};

export default LeadDuplicateWarning;
