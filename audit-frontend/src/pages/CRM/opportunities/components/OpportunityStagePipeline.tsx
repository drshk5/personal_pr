import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useMoveStage } from "@/hooks/api/CRM/use-opportunities";
import { usePipeline } from "@/hooks/api/CRM/use-pipelines";
import { toast } from "sonner";
import type { OpportunityDetailDto } from "@/types/CRM/opportunity";
import type { PipelineListDto } from "@/types/CRM/pipeline";

interface OpportunityStagePipelineProps {
  opportunity: OpportunityDetailDto;
  pipelines: PipelineListDto[];
  canEdit: boolean;
}

export default function OpportunityStagePipeline({
  opportunity,
  canEdit,
}: OpportunityStagePipelineProps) {
  const moveStage = useMoveStage();
  const { data: pipelineDetail } = usePipeline(opportunity.strPipelineGUID);
  const stages = pipelineDetail?.Stages || [];

  // Sort stages by display order
  const sortedStages = [...stages]
    .filter((s) => !s.bolIsWonStage && !s.bolIsLostStage)
    .sort((a, b) => a.intDisplayOrder - b.intDisplayOrder);

  const currentStageIdx = sortedStages.findIndex(
    (s) => s.strStageGUID === opportunity.strStageGUID
  );

  const handleMoveToStage = async (stageGUID: string) => {
    if (!canEdit) return;
    try {
      await moveStage.mutateAsync({
        id: opportunity.strOpportunityGUID,
        data: { strStageGUID: stageGUID },
      });
      toast.success("Stage updated! Linked contacts lifecycle stages auto-synced.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to move stage");
    }
  };

  if (sortedStages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Pipeline Progress</CardTitle>
          <Badge variant="outline">{opportunity.strPipelineName}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stage Progress Bar */}
        <div className="relative">
          <div className="flex items-center w-full overflow-x-auto gap-1">
            {sortedStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              const isFuture = idx > currentStageIdx;

              return (
                <div key={stage.strStageGUID} className="flex items-center flex-1 min-w-0">
                  <button
                    className={cn(
                      "flex-1 relative py-3 px-2 text-center rounded-md transition-all text-xs font-medium",
                      "border-2",
                      isCompleted && "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400",
                      isCurrent && "bg-primary/10 border-primary text-primary ring-2 ring-primary/20",
                      isFuture && "bg-muted border-muted-foreground/20 text-muted-foreground",
                      canEdit && isFuture && "hover:bg-muted/80 cursor-pointer hover:border-primary/50",
                      canEdit && isCompleted && "hover:bg-green-50 dark:hover:bg-green-900/50 cursor-pointer",
                      !canEdit && "cursor-default"
                    )}
                    onClick={() => {
                      if (canEdit && !isCurrent) {
                        handleMoveToStage(stage.strStageGUID);
                      }
                    }}
                    disabled={!canEdit || isCurrent || moveStage.isPending}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : isCurrent ? (
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="block truncate">{stage.strStageName}</span>
                    <span className="block text-[10px] opacity-60">
                      {stage.intProbabilityPercent}%
                    </span>
                  </button>
                  {idx < sortedStages.length - 1 && (
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 flex-shrink-0 mx-0.5",
                        idx < currentStageIdx
                          ? "text-green-500"
                          : "text-muted-foreground/30"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Move Info */}
        {canEdit && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Click any stage to move this opportunity. Linked contacts will auto-advance their lifecycle stage.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
