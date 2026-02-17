import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Edit,
  Save,
  X,
  Target,
  DollarSign,
  Calendar,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useUpdateOpportunity, useCloseOpportunity } from "@/hooks/api/CRM/use-opportunities";
import { toast } from "sonner";
import type { OpportunityDetailDto } from "@/types/CRM/opportunity";
import { OPPORTUNITY_CURRENCIES } from "@/types/CRM/opportunity";
import { format } from "date-fns";

interface OpportunityOverviewTabProps {
  opportunity: OpportunityDetailDto;
  canEdit: boolean;
}

export default function OpportunityOverviewTab({
  opportunity,
  canEdit,
}: OpportunityOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeStatus, setCloseStatus] = useState<"Won" | "Lost">("Won");

  const [formData, setFormData] = useState({
    strOpportunityName: opportunity.strOpportunityName,
    strStageGUID: opportunity.strStageGUID,
    dblAmount: opportunity.dblAmount || 0,
    strCurrency: opportunity.strCurrency || "USD",
    dtExpectedCloseDate: opportunity.dtExpectedCloseDate
      ? new Date(opportunity.dtExpectedCloseDate).toISOString().slice(0, 10)
      : "",
    strDescription: opportunity.strDescription || "",
    strAssignedToGUID: opportunity.strAssignedToGUID || "",
    strAccountGUID: opportunity.strAccountGUID || "",
  });

  const updateMutation = useUpdateOpportunity();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: opportunity.strOpportunityGUID,
        data: {
          ...formData,
          dtExpectedCloseDate: formData.dtExpectedCloseDate
            ? new Date(formData.dtExpectedCloseDate).toISOString()
            : null,
        },
      });
      toast.success("Opportunity updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update opportunity");
    }
  };

  const handleCancel = () => {
    setFormData({
      strOpportunityName: opportunity.strOpportunityName,
      strStageGUID: opportunity.strStageGUID,
      dblAmount: opportunity.dblAmount || 0,
      strCurrency: opportunity.strCurrency || "USD",
      dtExpectedCloseDate: opportunity.dtExpectedCloseDate
        ? new Date(opportunity.dtExpectedCloseDate).toISOString().slice(0, 10)
        : "",
      strDescription: opportunity.strDescription || "",
      strAssignedToGUID: opportunity.strAssignedToGUID || "",
      strAccountGUID: opportunity.strAccountGUID || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column - Opportunity Information */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Deal Information</CardTitle>
              {canEdit && opportunity.strStatus === "Open" && !isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : canEdit && isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Opportunity Name *</Label>
                  <Input
                    value={formData.strOpportunityName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        strOpportunityName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={formData.dblAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dblAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={formData.strCurrency}
                      onValueChange={(v) =>
                        setFormData({ ...formData, strCurrency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPPORTUNITY_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expected Close Date</Label>
                  <Input
                    type="date"
                    value={formData.dtExpectedCloseDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dtExpectedCloseDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.strDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        strDescription: e.target.value,
                      })
                    }
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <InfoRow icon={Target} label="Name" value={opportunity.strOpportunityName} />
                <InfoRow
                  icon={DollarSign}
                  label="Amount"
                  value={
                    opportunity.dblAmount
                      ? `${opportunity.strCurrency} ${opportunity.dblAmount.toLocaleString()}`
                      : "No amount set"
                  }
                />
                <InfoRow
                  icon={TrendingUp}
                  label="Probability"
                  value={`${opportunity.intProbability}%`}
                />
                <InfoRow icon={Building2} label="Account" value={opportunity.strAccountName} />
                <InfoRow
                  icon={Calendar}
                  label="Expected Close"
                  value={
                    opportunity.dtExpectedCloseDate
                      ? format(new Date(opportunity.dtExpectedCloseDate), "PPP")
                      : "Not set"
                  }
                />
                <InfoRow
                  icon={Calendar}
                  label="Created"
                  value={format(new Date(opportunity.dtCreatedOn), "PPP")}
                />
                <InfoRow
                  icon={Calendar}
                  label="Stage Since"
                  value={format(new Date(opportunity.dtStageEnteredOn), "PPP")}
                />
                {opportunity.strDescription && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {opportunity.strDescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Status & Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline & Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pipeline</span>
                <span className="text-sm font-medium">{opportunity.strPipelineName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Stage</span>
                <Badge variant="outline">{opportunity.strStageName}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  className={`${
                    opportunity.strStatus === "Won"
                      ? "bg-green-500"
                      : opportunity.strStatus === "Lost"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  } text-white`}
                >
                  {opportunity.strStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Days in Stage</span>
                <span
                  className={`text-sm font-medium ${
                    opportunity.bolIsRotting ? "text-amber-500" : ""
                  }`}
                >
                  {opportunity.intDaysInStage} days
                  {opportunity.bolIsRotting && (
                    <AlertTriangle className="inline h-4 w-4 ml-1" />
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <span className="text-sm font-medium">
                  {opportunity.strAssignedToName || "Unassigned"}
                </span>
              </div>
              {opportunity.dtLastActivityOn && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Activity</span>
                  <span className="text-sm">
                    {format(new Date(opportunity.dtLastActivityOn), "PPP")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Close Actions */}
        {canEdit && opportunity.strStatus === "Open" && (
          <Card>
            <CardHeader>
              <CardTitle>Close Deal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Mark this opportunity as Won or Lost. This will also update linked contact lifecycle stages automatically.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setCloseStatus("Won");
                    setShowCloseDialog(true);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Won
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setCloseStatus("Lost");
                    setShowCloseDialog(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Lost
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Won/Lost Info */}
        {opportunity.strStatus === "Lost" && opportunity.strLossReason && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Loss Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{opportunity.strLossReason}</p>
              {opportunity.dtActualCloseDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Closed on {format(new Date(opportunity.dtActualCloseDate), "PPP")}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {opportunity.strStatus === "Won" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-500 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Deal Won!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {opportunity.dblAmount
                  ? `${opportunity.strCurrency} ${opportunity.dblAmount.toLocaleString()}`
                  : "Value not set"}
              </p>
              {opportunity.dtActualCloseDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Won on {format(new Date(opportunity.dtActualCloseDate), "PPP")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Close Dialog */}
      <CloseOpportunityDialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        opportunityId={opportunity.strOpportunityGUID}
        status={closeStatus}
      />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground w-32">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

function CloseOpportunityDialog({
  open,
  onClose,
  opportunityId,
  status,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  status: "Won" | "Lost";
}) {
  const closeMutation = useCloseOpportunity();
  const [lossReason, setLossReason] = useState("");

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync({
        id: opportunityId,
        data: {
          strStatus: status,
          strLossReason: status === "Lost" ? lossReason : null,
          dtActualCloseDate: new Date().toISOString(),
        },
      });
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to close opportunity");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Mark as {status === "Won" ? "Won" : "Lost"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            {status === "Won"
              ? "Congratulations! This will mark the deal as won and advance all linked contacts to 'Customer' lifecycle stage."
              : "This will mark the deal as lost."}
          </p>
          {status === "Lost" && (
            <div className="space-y-2">
              <Label>Loss Reason</Label>
              <Textarea
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                placeholder="Why was this deal lost?"
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={
              status === "Won"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }
            onClick={handleClose}
            disabled={closeMutation.isPending}
          >
            {closeMutation.isPending
              ? "Closing..."
              : `Mark as ${status}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
