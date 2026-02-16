import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  List,
  GripVertical,
} from "lucide-react";

import type { OpportunityListDto, OpportunityBoardDto } from "@/types/CRM/opportunity";
import {
  useOpportunityBoard,
  useMoveStage,
} from "@/hooks/api/CRM/use-opportunities";
import { usePipelines } from "@/hooks/api/CRM/use-pipelines";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { Actions, FormModules } from "@/lib/permissions";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Skeleton } from "@/components/ui/skeleton";

// ── Kanban Card ─────────────────────────────────────────────────

interface KanbanCardProps {
  opportunity: OpportunityListDto;
  onDragStart: (e: React.DragEvent, oppId: string) => void;
  onClick: (oppId: string) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  opportunity,
  onDragStart,
  onClick,
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, opportunity.strOpportunityGUID)}
      onClick={() => onClick(opportunity.strOpportunityGUID)}
      className="bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium truncate flex-1 group-hover:text-primary">
          {opportunity.strOpportunityName}
        </h4>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
      </div>

      {opportunity.strAccountName && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {opportunity.strAccountName}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        {opportunity.dblAmount != null ? (
          <span className="text-xs font-semibold flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {opportunity.strCurrency}{" "}
            {opportunity.dblAmount.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No amount</span>
        )}

        {opportunity.bolIsRotting && (
          <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-medium">Rotting</span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{opportunity.intProbability}%</span>
        {opportunity.dtExpectedCloseDate && (
          <span>
            {format(new Date(opportunity.dtExpectedCloseDate), "MMM d")}
          </span>
        )}
      </div>

      {opportunity.strAssignedToName && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-medium text-primary">
              {opportunity.strAssignedToName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {opportunity.strAssignedToName}
          </span>
        </div>
      )}
    </div>
  );
};

// ── Kanban Column ───────────────────────────────────────────────

interface KanbanColumnProps {
  stage: OpportunityBoardDto;
  onDragStart: (e: React.DragEvent, oppId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageGUID: string) => void;
  onCardClick: (oppId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
}) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div
      className="flex-shrink-0 w-72 flex flex-col bg-muted/30 rounded-lg border"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.strStageGUID)}
    >
      {/* Column Header */}
      <div className="p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate">
            {stage.strStageName}
          </h3>
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-background text-xs font-medium">
            {stage.intCount}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {stage.intProbabilityPercent}% probability
          </span>
          {stage.dblTotalValue > 0 && (
            <span className="text-xs font-medium">
              {formatCurrency(stage.dblTotalValue)}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[200px] max-h-[calc(100vh-280px)]">
        {stage.opportunities.map((opp) => (
          <KanbanCard
            key={opp.strOpportunityGUID}
            opportunity={opp}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
        {stage.opportunities.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  );
};

// ── Board Page ──────────────────────────────────────────────────

const OpportunityBoard: React.FC = () => {
  const navigate = useNavigate();
  const HeaderIcon = useMenuIcon(FormModules.CRM_OPPORTUNITY, TrendingUp);

  // Pipeline selection
  const { data: pipelines, isLoading: loadingPipelines } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");

  // Set default pipeline
  React.useEffect(() => {
    if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
      const defaultPipeline =
        pipelines.find((p) => p.bolIsDefault) || pipelines[0];
      setSelectedPipelineId(defaultPipeline.strPipelineGUID);
    }
  }, [pipelines, selectedPipelineId]);

  // Board data
  const { data: boardData, isLoading: loadingBoard } =
    useOpportunityBoard(selectedPipelineId || undefined);

  const { mutate: moveStage } = useMoveStage();

  // Sort columns by display order
  const sortedColumns = useMemo(() => {
    if (!boardData) return [];
    return [...boardData].sort(
      (a, b) => a.intDisplayOrder - b.intDisplayOrder
    );
  }, [boardData]);

  // Summary
  const totalDeals = useMemo(
    () => sortedColumns.reduce((sum, col) => sum + col.intCount, 0),
    [sortedColumns]
  );
  const totalValue = useMemo(
    () => sortedColumns.reduce((sum, col) => sum + col.dblTotalValue, 0),
    [sortedColumns]
  );

  // Drag & drop
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    setDraggedOppId(oppId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, stageGUID: string) => {
    e.preventDefault();
    if (draggedOppId) {
      moveStage({
        id: draggedOppId,
        data: { strStageGUID: stageGUID },
      });
      setDraggedOppId(null);
    }
  };

  const handleCardClick = (oppId: string) => {
    window.open(`/crm/opportunities/${oppId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <CustomContainer>
      <PageHeader
        title="Opportunity Board"
        description="Drag and drop deals between stages"
        icon={HeaderIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs sm:text-sm"
              onClick={() => navigate("/crm/opportunities")}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              List View
            </Button>
            <WithPermission
              module={FormModules.CRM_OPPORTUNITY}
              action={Actions.SAVE}
            >
              <Button
                onClick={() => navigate("/crm/opportunities/create")}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                New Opportunity
              </Button>
            </WithPermission>
          </div>
        }
      />

      {/* Pipeline Selector & Summary */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:items-center sm:justify-between">
        <div className="w-64">
          <Select
            value={selectedPipelineId}
            onValueChange={setSelectedPipelineId}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines?.map((p) => (
                <SelectItem
                  key={p.strPipelineGUID}
                  value={p.strPipelineGUID}
                >
                  {p.strPipelineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!loadingBoard && sortedColumns.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">{totalDeals}</strong> deals
            </span>
            <span>
              <strong className="text-foreground">
                {totalValue >= 1000000
                  ? `${(totalValue / 1000000).toFixed(1)}M`
                  : totalValue >= 1000
                    ? `${(totalValue / 1000).toFixed(1)}K`
                    : totalValue.toLocaleString()}
              </strong>{" "}
              total value
            </span>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {loadingBoard || loadingPipelines ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 bg-muted/30 rounded-lg border"
            >
              <div className="p-3 border-b">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16 mt-2" />
              </div>
              <div className="p-2 space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedColumns.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {sortedColumns.map((stage) => (
            <KanbanColumn
              key={stage.strStageGUID}
              stage={stage}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No pipeline data</p>
          <p className="text-sm mt-1">
            Select a pipeline or create opportunities to see the board
          </p>
        </div>
      )}
    </CustomContainer>
  );
};

export default OpportunityBoard;
