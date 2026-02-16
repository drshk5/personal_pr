import React, { useState } from "react";
import {
  Plus,
  Settings,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  StarOff,
} from "lucide-react";

import type { PipelineListDto } from "@/types/CRM/pipeline";
import {
  usePipelines,
  useDeletePipeline,
  useSetDefaultPipeline,
} from "@/hooks/api/CRM/use-pipelines";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { ListModules } from "@/lib/permissions";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { PipelineFormDialog } from "./PipelineFormDialog";

const PipelineList: React.FC = () => {
  const HeaderIcon = useMenuIcon(ListModules.CRM_PIPELINES, Settings);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<PipelineListDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PipelineListDto | null>(null);

  const { data: pipelines = [], isLoading } = usePipelines();
  const { mutate: deletePipeline, isPending: isDeleting } = useDeletePipeline();
  const { mutate: setDefault, isPending: isSettingDefault } = useSetDefaultPipeline();

  const handleCreate = () => {
    setEditingPipeline(null);
    setFormOpen(true);
  };

  const handleEdit = (pipeline: PipelineListDto) => {
    setEditingPipeline(pipeline);
    setFormOpen(true);
  };

  const handleDelete = (pipeline: PipelineListDto) => {
    setDeleteTarget(pipeline);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deletePipeline(
        { id: deleteTarget.strPipelineGUID },
        {
          onSuccess: () => {
            setDeleteTarget(null);
          },
        }
      );
    }
  };

  const handleSetDefault = (pipeline: PipelineListDto) => {
    if (!pipeline.bolIsDefault) {
      setDefault({ id: pipeline.strPipelineGUID });
    }
  };

  if (isLoading) {
    return (
      <CustomContainer>
        <PageHeader
          title="Pipelines"
          icon={HeaderIcon}
          description="Manage your sales pipelines and stages"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CustomContainer>
    );
  }

  return (
    <CustomContainer>
      <PageHeader
        title="Pipelines"
        icon={HeaderIcon}
        description="Manage your sales pipelines and stages"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Pipeline
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pipelines.map((pipeline) => (
          <Card
            key={pipeline.strPipelineGUID}
            className={pipeline.bolIsDefault ? "border-primary" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {pipeline.strPipelineName}
                    {pipeline.bolIsDefault && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </CardTitle>
                  {pipeline.strDescription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {pipeline.strDescription}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(pipeline)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!pipeline.bolIsDefault && (
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(pipeline)}
                        disabled={isSettingDefault}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(pipeline)}
                      className="text-destructive"
                      disabled={pipeline.bolIsDefault}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Stages</p>
                  <p className="text-2xl font-bold">{pipeline.intStageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opportunities</p>
                  <p className="text-2xl font-bold">
                    {pipeline.intOpportunityCount}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Badge
                  variant={pipeline.bolIsActive ? "success" : "secondary"}
                  className="text-xs"
                >
                  {pipeline.bolIsActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {pipelines.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pipelines found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first pipeline
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Pipeline
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <PipelineFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPipeline(null);
        }}
        pipeline={editingPipeline}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Pipeline"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.strPipelineName}"? This action cannot be undone.${
                deleteTarget.intOpportunityCount > 0
                  ? ` This pipeline has ${deleteTarget.intOpportunityCount} associated opportunities.`
                  : ""
              }`
            : ""
        }
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default PipelineList;
