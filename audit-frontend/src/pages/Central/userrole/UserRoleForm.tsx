import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Validation schema and type
import { userRoleSchema, type UserRoleFormValues } from "@/validations";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Dialog for delete confirmation
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";

// Icons
import { ArrowLeft, Users, Trash2, Save } from "lucide-react";
import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";

// Services and hooks
// No longer need useUserRights
import {
  useUserRole,
  useUpdateUserRole,
  useCreateUserRole,
  useDeleteUserRole,
  useMenuIcon,
} from "@/hooks";
// No longer need useModulePermissions
import { Actions, FormModules } from "@/lib/permissions";
import { WithPermission } from "@/components/ui/with-permission";
import type { UserRoleCreate, UserRoleUpdate } from "@/types/central/user-role";
import { UserRoleFormSkeleton } from "./UserRoleFormSkeleton";

const UserRoleForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // We don't need menuItems anymore as we're using WithPermission
  const [showDeleteConfirm, setShowDeleteConfirm] =
    React.useState<boolean>(false);

  // React Query hooks with loading states
  const { data: userRole, isLoading: isLoadingUserRole } = useUserRole(
    id !== "new" ? id : undefined
  );

  const { mutate: createUserRoleMutate, isPending: isCreating } =
    useCreateUserRole();

  const { mutate: updateUserRoleMutate, isPending: isUpdating } =
    useUpdateUserRole();

  const { mutate: deleteUserRoleMutate, isPending: isDeleting } =
    useDeleteUserRole();

  // Check if in edit mode based on URL parameters and ID

  const isEditMode = !!id && id !== "new";

  // Permissions are now handled entirely by WithPermission component

  // Create the form with explicit type
  const form = useForm({
    resolver: zodResolver(userRoleSchema),
    defaultValues: {
      strName: "",
      strDesc: "",
      bolIsActive: true,
    },
  } as const);

  // Load data when in edit mode
  useEffect(() => {
    if (isEditMode && id && id !== "new" && !isLoadingUserRole && userRole) {
      form.setValue("strName", userRole.strName);
      form.setValue("strDesc", userRole.strDesc || "");
      form.setValue("bolIsActive", userRole.bolIsActive);
    }
  }, [form, id, isEditMode, isLoadingUserRole, userRole]);

  const handleDelete = () => {
    if (!id) return;

    deleteUserRoleMutate(id, {
      onSuccess: () => {
        navigate("/user-role");
        setShowDeleteConfirm(false);
      },
    });
  };

  const onSubmit = (data: UserRoleFormValues) => {
    if (isEditMode && id && id !== "new") {
      const updateData: UserRoleUpdate = {
        strName: data.strName,
        strDesc: data.strDesc || "",
        bolIsActive: data.bolIsActive,
      };

      updateUserRoleMutate(
        { id, data: updateData },
        {
          onSuccess: () => {
            navigate("/user-role");
          },
        }
      );
    } else {
      const createData: UserRoleCreate = {
        strName: data.strName,
        strDesc: data.strDesc || "",
        bolIsActive: data.bolIsActive,
      };

      createUserRoleMutate(createData, {
        onSuccess: () => {
          navigate("/user-role");
        },
      });
    }
  };

  const HeaderIcon = useMenuIcon(FormModules.USER_ROLE, Users);

  // Determine if the component is in a loading state
  const isLoading = isLoadingUserRole;

  return (
    <CustomContainer>
      <PageHeader
        title={isEditMode ? "Edit User Role" : "New User Role"}
        description={
          isEditMode ? "Update user role details" : "Create a new user role"
        }
        icon={HeaderIcon}
        actions={
          <Button variant="outline" onClick={() => navigate("/user-role")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      {isLoading ? (
        <UserRoleFormSkeleton />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <FormField
                    control={form.control}
                    name="strName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Role Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter role name"
                            disabled={isUpdating || isCreating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Active status */}
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
                            disabled={isUpdating || isCreating}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description field */}
                <FormField
                  control={form.control}
                  name="strDesc"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter description (optional)"
                          disabled={isUpdating || isCreating}
                          onChange={field.onChange}
                          value={field.value || ""}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-6">
                <div>
                  {isEditMode && (
                    <WithPermission
                      module={FormModules.USER_ROLE}
                      action={Actions.DELETE}
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={
                          isDeleting ||
                          isUpdating ||
                          isCreating ||
                          userRole?.bolSystemCreated
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </WithPermission>
                  )}
                </div>
                <div>
                  {/* Allow saving if user has save permission */}
                  <WithPermission
                    module={FormModules.USER_ROLE}
                    action={Actions.SAVE}
                  >
                    <Button
                      type="submit"
                      disabled={isUpdating || isCreating || isLoading}
                    >
                      {isEditMode ? (
                        <Save className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {isEditMode ? "Update" : "Create"}
                    </Button>
                  </WithPermission>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user role? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </CustomContainer>
  );
};

export default UserRoleForm;
