import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, Calendar, Eye, Edit, Search, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOpportunities, useCreateOpportunity } from "@/hooks/api/CRM/use-opportunities";
import { usePipelines, usePipeline } from "@/hooks/api/CRM/use-pipelines";
import { toast } from "sonner";
import type { CreateOpportunityDto } from "@/types/CRM/opportunity";
import type { PipelineListDto, PipelineStageDto } from "@/types/CRM/pipeline";

interface AccountOpportunitiesTabProps {
  accountId: string;
  accountName: string;
}

const OPPORTUNITY_STAGES = [
  "Prospecting",
  "Qualification",
  "Needs Analysis",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

export default function AccountOpportunitiesTab({
  accountId,
  accountName,
}: AccountOpportunitiesTabProps) {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: opportunitiesData, isLoading } = useOpportunities({
    strAccountGUID: accountId,
    pageSize: 100,
  });

  const opportunities = Array.isArray(opportunitiesData?.data)
    ? opportunitiesData.data
    : (opportunitiesData?.data as any)?.items || (opportunitiesData as any)?.items || [];
  const filteredOpportunities = opportunities.filter((opp: any) => {
    const matchesSearch = opp.strOpportunityName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === "all" || opp.strStageName === stageFilter;
    return matchesSearch && matchesStage;
  });

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.dblAmount || 0), 0);
  const wonOpportunities = opportunities.filter((opp) => opp.strStageName === "Closed Won");
  const wonValue = wonOpportunities.reduce((sum, opp) => sum + (opp.dblAmount || 0), 0);
  const openOpportunities = opportunities.filter(
    (opp) => opp.strStageName !== "Closed Won" && opp.strStageName !== "Closed Lost"
  );

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Prospecting":
        return "bg-gray-500";
      case "Qualification":
        return "bg-blue-500";
      case "Needs Analysis":
        return "bg-cyan-500";
      case "Proposal":
        return "bg-yellow-500";
      case "Negotiation":
        return "bg-orange-500";
      case "Closed Won":
        return "bg-green-500";
      case "Closed Lost":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{opportunities.length} opportunities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${wonValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{wonOpportunities.length} closed won</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Opportunities</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{openOpportunities.length}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Opportunities ({opportunities.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search opportunities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {OPPORTUNITY_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Opportunity
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading opportunities...
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || stageFilter !== "all"
                  ? "No opportunities found matching your filters"
                  : "No opportunities yet. Click 'New Opportunity' to add one."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity Name</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Close Date</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.strOpportunityGUID}>
                      <TableCell className="font-medium">
                        {opportunity.strOpportunityName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getStageColor(
                              opportunity.strStageName
                            )}`}
                          />
                          <Badge variant="outline">{opportunity.strStageName}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        ${opportunity.dblAmount?.toLocaleString() || "0"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2 max-w-[60px]">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{
                                width: `${opportunity.intProbability || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm">{opportunity.intProbability || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {opportunity.dtExpectedCloseDate
                          ? new Date(opportunity.dtExpectedCloseDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{opportunity.strAssignedToName || "Unassigned"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/crm/opportunities/${opportunity.strOpportunityGUID}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(
                                `/crm/opportunities/${opportunity.strOpportunityGUID}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateOpportunityDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        accountId={accountId}
        accountName={accountName}
      />
    </>
  );
}

interface CreateOpportunityDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

function CreateOpportunityDialog({
  open,
  onClose,
  accountId,
  accountName,
}: CreateOpportunityDialogProps) {
  const createMutation = useCreateOpportunity();
  const { data: pipelinesData } = usePipelines();
  const pipelines = pipelinesData || [];
  
  const [formData, setFormData] = useState<CreateOpportunityDto>({
    strOpportunityName: "",
    strPipelineGUID: "",
    strStageGUID: "",
    dblAmount: 0,
    strCurrency: "USD",
    dtExpectedCloseDate: "",
    strAccountGUID: accountId,
    strDescription: "",
  });
  
  // Fetch stages when pipeline is selected
  const { data: pipelineDetail } = usePipeline(formData.strPipelineGUID || undefined);
  const stages = pipelineDetail?.Stages || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Opportunity created successfully");
      onClose();
      setFormData({
        strOpportunityName: "",
        strPipelineGUID: "",
        strStageGUID: "",
        dblAmount: 0,
        strCurrency: "USD",
        dtExpectedCloseDate: "",
        strAccountGUID: accountId,
        strDescription: "",
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create opportunity");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Opportunity for {accountName}</DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline">Pipeline *</Label>
                <Select
                  value={formData.strPipelineGUID}
                  onValueChange={(value) => 
                    setFormData({ ...formData, strPipelineGUID: value, strStageGUID: "" })
                  }
                >
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                <Input
                  id="closeDate"
                  type="date"
                  value={formData.dtExpectedCloseDate ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dtExpectedCloseDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
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
