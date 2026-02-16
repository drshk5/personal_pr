import React, { useState } from "react";
import { UserPlus, Wand2 } from "lucide-react";
import {
  useBulkAssignLeads,
  useAutoAssignLeads,
  useAssignmentRules,
} from "@/hooks/api/CRM/use-leads";
import { useActiveUsers } from "@/hooks/api/central/use-users";
import { useDebounce } from "@/hooks/common/use-debounce";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";

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
  const debouncedAssignToSearch = useDebounce(assignToSearch, 300);

  const { mutate: bulkAssign, isPending: isAssigning } =
    useBulkAssignLeads();
  const { mutate: autoAssign, isPending: isAutoAssigning } =
    useAutoAssignLeads();
  const {
    data: assignmentRules,
    isLoading: isRulesLoading,
    isError: isRulesError,
  } = useAssignmentRules(open);
  const { data: activeUsers = [], isLoading: isUsersLoading } = useActiveUsers(
    debouncedAssignToSearch || undefined,
    open
  );

  React.useEffect(() => {
    if (!open) {
      setAssignToGUID("");
      setAssignToSearch("");
    }
  }, [open]);

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
  const canRunAutoAssign =
    !isRulesLoading && (activeRules.length > 0 || isRulesError);

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
              <label className="text-sm font-medium text-foreground">Assign To</label>
              <Input
                placeholder="Search team member..."
                value={assignToSearch}
                onChange={(e) => setAssignToSearch(e.target.value)}
                className="h-9"
              />

              <Select value={assignToGUID} onValueChange={setAssignToGUID}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {isUsersLoading && (
                    <SelectItem value="__loading__" disabled>
                      Loading team members...
                    </SelectItem>
                  )}

                  {!isUsersLoading && activeUsers.length === 0 && (
                    <SelectItem value="__empty__" disabled>
                      No team members found
                    </SelectItem>
                  )}

                  {!isUsersLoading &&
                    activeUsers.map((user) => (
                      <SelectItem
                        key={user.strUserGUID}
                        value={user.strUserGUID}
                      >
                        {user.strName}
                        {user.strEmailId ? ` (${user.strEmailId})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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
              <h4 className="text-sm font-medium text-foreground">Active Assignment Rules</h4>
              {isRulesLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading assignment rules...
                </p>
              ) : isRulesError ? (
                <p className="text-sm text-destructive">
                  Unable to load assignment rules. You can still run
                  auto-assignment, but rule details are unavailable.
                </p>
              ) : activeRules.length > 0 ? (
                <div className="space-y-2">
                  {activeRules.map((rule) => (
                    <div
                      key={rule.strRuleGUID}
                      className="flex items-center justify-between bg-background rounded-md px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
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
                disabled={isAutoAssigning || !canRunAutoAssign}
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
