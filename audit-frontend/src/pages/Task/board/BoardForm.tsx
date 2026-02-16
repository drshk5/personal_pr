import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, LayoutDashboard, Save, Trash2 } from "lucide-react";

import {
  useBoard,
  useCreateBoard,
  useUpdateBoard,
  useDeleteBoard,
} from "@/hooks/api/task/use-board";

import { Actions, FormModules } from "@/lib/permissions";

import {
  createBoardSchema,
  type CreateBoardFormValues,
} from "@/validations/task/board";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import CustomContainer from "@/components/layout/custom-container";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { WithPermission } from "@/components/ui/with-permission";
import { BoardMembersTab } from "./BoardMembersTab";

const BoardForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  const isEditMode = !!id && id !== "new";

  const {
    data: boardData,
    isLoading: isLoadingBoard,
    error: boardError,
  } = useBoard(isEditMode && id ? id : undefined);

  const { mutate: createBoard, isPending: isCreating } = useCreateBoard();
  const { mutate: updateBoard, isPending: isUpdating } = useUpdateBoard();
  const { mutate: deleteBoard, isPending: isDeleting } = useDeleteBoard();

  const form = useForm<CreateBoardFormValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      strName: "",
      strDescription: "",
      bolIsActive: true,
    },
  });

  React.useEffect(() => {
    if (isEditMode && boardData) {
      form.reset({
        strName: boardData.strName,
        strDescription: boardData.strDescription || "",
        bolIsActive: boardData.bolIsActive,
      });
    }
  }, [isEditMode, boardData, form]);

  const isSaving = isCreating || isUpdating;
  const isLoading = isLoadingBoard;

  const onSubmit = (data: CreateBoardFormValues) => {
    if (isEditMode && id) {
      updateBoard(
        { id, data },
        {
          onSuccess: () => {
            navigate("/project");
          },
        }
      );
      return;
    }

    createBoard(data, {
      onSuccess: (createdBoard) => {
        if (createdBoard?.strBoardGUID) {
          navigate(`/project/${createdBoard.strBoardGUID}`);
        } else {
          navigate("/project");
        }
      },
    });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteBoard(
      { id },
      {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          navigate("/project");
        },
      }
    );
  };

  if (isEditMode && boardError) {
    return <NotFound pageName="Project" />;
  }

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit Project" : "Create Project"}
        description={
          isEditMode ? "Update project details" : "Create a new project"
        }
        icon={LayoutDashboard}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/project")}
            className="h-9 text-xs sm:text-sm"
            size="sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-10">
                <p className="text-muted-foreground">Loading project...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="strName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Project Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter project name"
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="strDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter project description"
                              disabled={isSaving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bolIsActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-start gap-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">
                              Active
                            </FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isSaving}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-between pt-2 pb-6 border-border-color px-6 py-4 bg-muted/20">
              <div>
                {isEditMode && (
                  <WithPermission
                    module={FormModules.BOARD}
                    action={Actions.DELETE}
                  >
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting || isSaving}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </WithPermission>
                )}
              </div>
              <div>
                <WithPermission
                  module={FormModules.BOARD}
                  action={isEditMode ? Actions.EDIT : Actions.SAVE}
                >
                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSaving || isLoading}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving
                      ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                      : isEditMode
                        ? "Update"
                        : "Create"}
                  </Button>
                </WithPermission>
              </div>
            </CardFooter>
          </Card>
        )}

        <BoardMembersTab
          boardGuid={isEditMode ? id : undefined}
          isProjectCreated={isEditMode}
          onMemberAdded={() => {}}
        />
      </div>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default BoardForm;
