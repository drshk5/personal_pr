import React, { useState, useMemo } from "react";
import { GitMerge, Check } from "lucide-react";
import type { LeadDuplicateDto } from "@/types/CRM/lead";
import { useMergeLeads } from "@/hooks/api/CRM/use-leads";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface LeadMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryLeadId: string;
  primaryLeadName: string;
  primaryLeadEmail: string;
  duplicates: LeadDuplicateDto[];
  onSuccess?: () => void;
}

type MergeField = {
  key: string;
  label: string;
  primaryValue: string;
  duplicateValues: Record<string, string>;
};

const MERGE_FIELDS = [
  { key: "strFirstName", label: "First Name" },
  { key: "strLastName", label: "Last Name" },
  { key: "strEmail", label: "Email" },
  { key: "strCompanyName", label: "Company" },
];

const LeadMergeDialog: React.FC<LeadMergeDialogProps> = ({
  open,
  onOpenChange,
  primaryLeadId,
  primaryLeadName,
  primaryLeadEmail,
  duplicates,
  onSuccess,
}) => {
  const { mutate: mergeLeads, isPending } = useMergeLeads();

  // Track which duplicates are selected for merge
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(
    () => new Set(duplicates.map((d) => d.strLeadGUID))
  );

  // Track field overrides — which lead's value to use for each field
  const [fieldOverrides, setFieldOverrides] = useState<
    Record<string, string>
  >({});

  const toggleDuplicate = (guid: string) => {
    setSelectedDuplicates((prev) => {
      const next = new Set(prev);
      if (next.has(guid)) {
        next.delete(guid);
      } else {
        next.add(guid);
      }
      return next;
    });
  };

  // Build merge-field comparison data
  const mergeFields: MergeField[] = useMemo(() => {
    return MERGE_FIELDS.map((field) => ({
      key: field.key,
      label: field.label,
      primaryValue:
        field.key === "strFirstName"
          ? primaryLeadName.split(" ")[0] || ""
          : field.key === "strLastName"
            ? primaryLeadName.split(" ").slice(1).join(" ") || ""
            : field.key === "strEmail"
              ? primaryLeadEmail
              : "",
      duplicateValues: duplicates.reduce(
        (acc, dup) => {
          acc[dup.strLeadGUID] =
            (dup as Record<string, unknown>)[field.key] as string || "";
          return acc;
        },
        {} as Record<string, string>
      ),
    }));
  }, [primaryLeadName, primaryLeadEmail, duplicates]);

  const handleMerge = () => {
    mergeLeads(
      {
        strPrimaryLeadGUID: primaryLeadId,
        strDuplicateLeadGUIDs: Array.from(selectedDuplicates),
        fieldOverrides:
          Object.keys(fieldOverrides).length > 0
            ? fieldOverrides
            : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            Merge Duplicate Leads
          </DialogTitle>
          <DialogDescription>
            Merge duplicates into{" "}
            <strong>{primaryLeadName}</strong>. Activities and notes from
            duplicates will be transferred to the primary lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Primary lead */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{primaryLeadName}</span>
                  <Badge variant="outline" className="text-xs border-primary text-primary">
                    Primary
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {primaryLeadEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Duplicate leads to merge */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-foreground">
              Duplicates to Merge
            </h4>
            <div className="space-y-2">
              {duplicates.map((dup) => (
                <div
                  key={dup.strLeadGUID}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedDuplicates.has(dup.strLeadGUID)
                      ? "border-primary/50 bg-primary/5"
                      : "border-muted opacity-60"
                  }`}
                  onClick={() => toggleDuplicate(dup.strLeadGUID)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center ${
                          selectedDuplicates.has(dup.strLeadGUID)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {selectedDuplicates.has(dup.strLeadGUID) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-sm text-foreground">
                          {dup.strFirstName} {dup.strLastName}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {dup.strEmail}
                          {dup.strCompanyName && ` - ${dup.strCompanyName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {dup.strStatus}
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
                        {Math.round(dup.dblMatchScore)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field-level comparison */}
          {mergeFields.length > 0 && selectedDuplicates.size > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-foreground">
                Field Resolution
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                By default, the primary lead's values are kept. Click a
                duplicate's value to use it instead.
              </p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-foreground w-28">
                        Field
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-foreground">
                        Primary
                      </th>
                      {duplicates
                        .filter((d) =>
                          selectedDuplicates.has(d.strLeadGUID)
                        )
                        .map((dup) => (
                          <th
                            key={dup.strLeadGUID}
                            className="text-left px-3 py-2 font-medium text-foreground"
                          >
                            {dup.strFirstName}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mergeFields.map((field) => (
                      <tr key={field.key} className="border-t">
                        <td className="px-3 py-2 text-xs font-medium text-muted-foreground">
                          {field.label}
                        </td>
                        <td
                          className={`px-3 py-2 text-xs cursor-pointer rounded ${
                            !fieldOverrides[field.key]
                              ? "bg-primary/10 font-medium"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            const next = { ...fieldOverrides };
                            delete next[field.key];
                            setFieldOverrides(next);
                          }}
                        >
                          {field.primaryValue || "-"}
                        </td>
                        {duplicates
                          .filter((d) =>
                            selectedDuplicates.has(d.strLeadGUID)
                          )
                          .map((dup) => (
                            <td
                              key={dup.strLeadGUID}
                              className={`px-3 py-2 text-xs cursor-pointer rounded ${
                                fieldOverrides[field.key] ===
                                dup.strLeadGUID
                                  ? "bg-primary/10 font-medium"
                                  : "hover:bg-muted/50"
                              }`}
                              onClick={() =>
                                setFieldOverrides((prev) => ({
                                  ...prev,
                                  [field.key]: dup.strLeadGUID,
                                }))
                              }
                            >
                              {field.duplicateValues[dup.strLeadGUID] ||
                                "-"}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isPending || selectedDuplicates.size === 0}
          >
            {isPending
              ? "Merging..."
              : `Merge ${selectedDuplicates.size} Duplicate${selectedDuplicates.size !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadMergeDialog;
