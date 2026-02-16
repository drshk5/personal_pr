import React, { useState } from "react";
import { UserPlus, Wand2 } from "lucide-react";
import {
  useBulkAssignLeads,
  useAutoAssignLeads,
  useAssignmentRules,
} from "@/hooks/api/CRM/use-leads";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface LeadAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeadIds: string[];
  onSuccess?: () => void;
}

const strategyLabels: Record<string, string> = {
  Manual: "Manual",
  RoundRobin: "Round Robin",
  Territory: "Territory-Based",
  Capacity: "Capacity-Based",
};

const LeadAssignmentDialog: React.FC<LeadAssignmentDialogProps> = ({
  open,
  onOpenChange,
  selectedLeadIds,
  onSuccess,
}) => {
  const [assignToGUID, setAssignToGUID] = useState("");
  const [assignToSearch, setAssignToSearch] = useState("");

  const { mutate: bulkAssign, isPending: isAssigning } =
    useBulkAssignLeads();
  const { mutate: autoAssign, isPending: isAutoAssigning } =
    useAutoAssignLeads();
  const { data: assignmentRules } = useAssignmentRules();

  const handleManualAssign = () => {
    if (!assignToGUID) return;
    bulkAssign(
      { guids: selectedLeadIds, strAssignedToGUID: assignToGUID },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleAutoAssign = () => {
    autoAssign(selectedLeadIds, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  const activeRules = assignmentRules?.filter((r) => r.bolIsActive) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Assign Leads
          </DialogTitle>
          <DialogDescription>
            Assign {selectedLeadIds.length} selected lead
            {selectedLeadIds.length !== 1 ? "s" : ""} to a team member.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="py-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="auto">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Auto-Assign
            </TabsTrigger>
          </TabsList>

          {/* Manual Assignment */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Assign To
              </label>
              <Input
                placeholder="Search team member..."
                value={assignToSearch}
                onChange={(e) => setAssignToSearch(e.target.value)}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Type to search for a team member, then select from the list.
              </p>
              {/* In a full implementation, this would be a combobox/autocomplete
                  connected to a users endpoint. For now it's a GUID input. */}
              <Input
                placeholder="Team member GUID"
                value={assignToGUID}
                onChange={(e) => setAssignToGUID(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualAssign}
                disabled={isAssigning || !assignToGUID}
              >
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* Auto Assignment */}
          <TabsContent value="auto" className="space-y-4 mt-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="text-sm font-medium">Active Assignment Rules</h4>
              {activeRules.length > 0 ? (
                <div className="space-y-2">
                  {activeRules.map((rule) => (
                    <div
                      key={rule.strRuleGUID}
                      className="flex items-center justify-between bg-background rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {rule.strRuleName}
                        </p>
                        {rule.strDescription && (
                          <p className="text-xs text-muted-foreground">
                            {rule.strDescription}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {strategyLabels[rule.strStrategy] ||
                          rule.strStrategy}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active assignment rules configured. Configure rules in
                  Settings to enable auto-assignment.
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Auto-assign will distribute {selectedLeadIds.length} lead
              {selectedLeadIds.length !== 1 ? "s" : ""} based on the active
              rules above (priority order: Territory &gt; Capacity &gt;
              Round Robin).
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isAutoAssigning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAutoAssign}
                disabled={isAutoAssigning || activeRules.length === 0}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isAutoAssigning ? "Assigning..." : "Auto-Assign"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadAssignmentDialog;
