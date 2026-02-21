import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { Eye, Target, DollarSign, TrendingUp, Plus } from "lucide-react";
import { useCreateOpportunity } from "@/hooks/api/CRM/use-opportunities";
import { usePipelines, usePipeline } from "@/hooks/api/CRM/use-pipelines";
import { useQueryClient } from "@tanstack/react-query";
import { contactQueryKeys } from "@/hooks/api/CRM/use-contacts";
import type { CreateOpportunityDto } from "@/types/CRM/opportunity";
import type { PipelineListDto, PipelineStageDto } from "@/types/CRM/pipeline";
import type { OpportunityListDtoForContact } from "@/types/CRM/contact";

interface ContactOpportunitiesTabProps {
  contactId: string;
  contactName: string;
  accountId?: string | null;
  accountName?: string | null;
  opportunities: OpportunityListDtoForContact[];
  canEdit: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-500",
  Won: "bg-green-500",
  Lost: "bg-red-500",
};

export default function ContactOpportunitiesTab({
  contactId,
  contactName,
  accountId,
  accountName,
  opportunities,
  canEdit,
}: ContactOpportunitiesTabProps) {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const totalValue = opportunities.reduce((sum, o) => sum + (o.dblAmount || 0), 0);
  const wonOpps = opportunities.filter((o) => o.strStatus === "Won");

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Opportunities
                </p>
                <h3 className="text-2xl font-bold text-foreground">{opportunities.length}</h3>
              </div>
              <div className="rounded-md bg-blue-500/15 p-2 text-blue-600">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Value
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  ${totalValue.toLocaleString()}
                </h3>
              </div>
              <div className="rounded-md bg-amber-500/15 p-2 text-amber-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Win Rate
                </p>
                <h3 className="text-2xl font-bold text-foreground">
                  {opportunities.length > 0
                    ? Math.round(
                        (wonOpps.length /
                          (wonOpps.length +
                            opportunities.filter((o) => o.strStatus === "Lost")
                              .length || 1)) *
                          100
                      )
                    : 0}
                  %
                </h3>
              </div>
              <div className="rounded-md bg-emerald-500/15 p-2 text-emerald-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities Table */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Linked Opportunities ({opportunities.length})</CardTitle>
            {canEdit && (
              <Button className="shadow-sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Opportunity
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No opportunities linked to this contact yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.strOpportunityGUID} className="hover:bg-muted/40">
                    <TableCell className="font-medium">
                      {opp.strOpportunityName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{opp.strStageName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          STATUS_COLORS[opp.strStatus] || "bg-gray-500"
                        } text-white`}
                      >
                        {opp.strStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {opp.dblAmount
                        ? `${opp.strCurrency} ${opp.dblAmount.toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(
                            `/crm/opportunities/${opp.strOpportunityGUID}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Opportunity Dialog */}
      <CreateOpportunityForContactDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        contactId={contactId}
        contactName={contactName}
        accountId={accountId}
        accountName={accountName}
      />
    </div>
  );
}

// ── Create Opportunity Dialog ──────────────────────────────────

interface CreateOpportunityForContactDialogProps {
  open: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  accountId?: string | null;
  accountName?: string | null;
}

function CreateOpportunityForContactDialog({
  open,
  onClose,
  contactId,
  contactName,
  accountId,
  accountName,
}: CreateOpportunityForContactDialogProps) {
  const createMutation = useCreateOpportunity();
  const queryClient = useQueryClient();
  const { data: pipelinesData } = usePipelines();
  const pipelines = pipelinesData || [];
  const normalizedAccountId = useMemo(() => {
    if (!accountId) return null;
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(accountId) ? accountId : null;
  }, [accountId]);

  const [formData, setFormData] = useState<CreateOpportunityDto>({
    strOpportunityName: "",
    strPipelineGUID: "",
    strStageGUID: "",
    dblAmount: 0,
    strCurrency: "INR",
    dtExpectedCloseDate: "",
    strAccountGUID: normalizedAccountId,
    strDescription: "",
  });

  const [contactRole, setContactRole] = useState<string>("DecisionMaker");

  useEffect(() => {
    if (!open) return;
    setFormData((prev) => ({
      ...prev,
      strAccountGUID: normalizedAccountId,
    }));
  }, [open, normalizedAccountId]);

  // Fetch stages when pipeline is selected
  const { data: pipelineDetail } = usePipeline(formData.strPipelineGUID || undefined);
  const stages = pipelineDetail?.Stages || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: CreateOpportunityDto = {
      ...formData,
      strAccountGUID: normalizedAccountId,
      contacts: [
        {
          strContactGUID: contactId,
          strRole: contactRole,
          bolIsPrimary: true,
        },
      ],
    };
    await createMutation.mutateAsync(submitData);
    // Refresh contact detail to show new opportunity
    await queryClient.invalidateQueries({ queryKey: contactQueryKeys.detail(contactId) });
    onClose();
    setFormData({
      strOpportunityName: "",
      strPipelineGUID: "",
      strStageGUID: "",
      dblAmount: 0,
      strCurrency: "INR",
      dtExpectedCloseDate: "",
      strAccountGUID: normalizedAccountId,
      strDescription: "",
    });
    setContactRole("DecisionMaker");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-border/70 bg-card/95 shadow-xl backdrop-blur">
        <DialogHeader>
          <DialogTitle>Create New Opportunity for {contactName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="opportunityName">Opportunity Name *</Label>
              <Input
                id="opportunityName"
                required
                value={formData.strOpportunityName}
                onChange={(e) =>
                  setFormData({ ...formData, strOpportunityName: e.target.value })
                }
              />
            </div>

            {/* Contact info (read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Input value={contactName} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactRole">Contact Role</Label>
                <Select
                  value={contactRole}
                  onValueChange={(value) => setContactRole(value)}
                >
                  <SelectTrigger className="border-border/70 bg-background/70">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DecisionMaker">Decision Maker</SelectItem>
                    <SelectItem value="Influencer">Influencer</SelectItem>
                    <SelectItem value="Champion">Champion</SelectItem>
                    <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                    <SelectItem value="EndUser">End User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account info (read-only if available) */}
            {accountName && (
              <div className="space-y-2">
                <Label>Account</Label>
                <Input value={accountName} disabled />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline">Pipeline *</Label>
                <Select
                  value={formData.strPipelineGUID}
                  onValueChange={(value) =>
                    setFormData({ ...formData, strPipelineGUID: value, strStageGUID: "" })
                  }
                >
                  <SelectTrigger className="border-border/70 bg-background/70">
                    <SelectValue placeholder="Select pipeline..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map((pipeline: PipelineListDto) => (
                      <SelectItem key={pipeline.strPipelineGUID} value={pipeline.strPipelineGUID}>
                        {pipeline.strPipelineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Stage *</Label>
                <Select
                  value={formData.strStageGUID}
                  onValueChange={(value) => setFormData({ ...formData, strStageGUID: value })}
                  disabled={!formData.strPipelineGUID}
                >
                  <SelectTrigger className="border-border/70 bg-background/70">
                    <SelectValue placeholder={formData.strPipelineGUID ? "Select stage..." : "Select pipeline first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: PipelineStageDto) => (
                      <SelectItem key={stage.strStageGUID} value={stage.strStageGUID}>
                        {stage.strStageName} ({stage.intProbabilityPercent}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.dblAmount ?? 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dblAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeDate">Expected Close Date</Label>
                <DatePicker
                  value={formData.dtExpectedCloseDate ? new Date(formData.dtExpectedCloseDate + "T12:00:00") : undefined}
                  onChange={(date) =>
                    setFormData({ ...formData, dtExpectedCloseDate: date ? format(date, "yyyy-MM-dd") : "" })
                  }
                  placeholder="Select expected close date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={formData.strDescription || ""}
                onChange={(e) =>
                  setFormData({ ...formData, strDescription: e.target.value })
                }
                placeholder="Add opportunity description..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Opportunity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
