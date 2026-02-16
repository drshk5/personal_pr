import React, { useState, useEffect } from "react";
import {
  useForm,
  type SubmitHandler,
  type Control,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActiveModules } from "@/hooks/api/central/use-modules";
import {
  useCreateGroupModule,
  useUpdateGroupModule,
  useDeleteGroupModule,
} from "@/hooks/api";
import type { GroupModuleSimple } from "@/types/central/group-module";
import {
  groupModuleFormSchema,
  type GroupModuleFormValues,
} from "@/validations/central/group-module";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { Input } from "@/components/ui/input";

interface GroupModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupModule?: GroupModuleSimple;
}

export const GroupModuleModal: React.FC<GroupModuleModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupModule,
}) => {
  const isEditMode = !!groupModule;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: modulesData = [], isLoading: isLoadingModules } =
    useActiveModules();
  const { mutate: createGroupModule, isPending: isCreating } =
    useCreateGroupModule();
  const { mutate: updateGroupModule, isPending: isUpdating } =
    useUpdateGroupModule();
  const { mutate: deleteGroupModule, isPending: isDeleting } =
    useDeleteGroupModule();
  const isSaving = isCreating || isUpdating;

  const form = useForm<GroupModuleFormValues>({
    resolver: zodResolver(
      groupModuleFormSchema
    ) as unknown as Resolver<GroupModuleFormValues>,
    defaultValues: {
      strModuleGUID: groupModule?.strModuleGUID || "",
      intVersion: groupModule?.intVersion || 1,
    },
  });
  useEffect(() => {
    if (groupModule) {
      form.reset({
        strModuleGUID: groupModule.strModuleGUID,
        intVersion: groupModule.intVersion,
      });
    } else {
      form.reset({
        strModuleGUID: "",
        intVersion: 1,
      });
    }
  }, [form, groupModule]);

  const handleFormSubmit: SubmitHandler<GroupModuleFormValues> = (data) => {
    if (isEditMode && groupModule) {
      updateGroupModule(
        {
          id: groupModule.strGroupModuleGUID,
          data: {
            intVersion: data.intVersion,
          },
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      createGroupModule(
        {
          strGroupGUID: groupId,
          strModuleGUID: data.strModuleGUID,
          intVersion: data.intVersion,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };
  const handleDelete = () => {
    if (!groupModule) return;

    deleteGroupModule(groupModule.strGroupModuleGUID, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        onClose();
      },
      onError: () => {},
    });
  };

  const footerContent = (
    <div className="flex w-full flex-col sm:flex-row justify-between gap-2">
      {isEditMode && (
        <Button
          variant="destructive"
          type="button"
          disabled={isSaving || isDeleting}
          onClick={() => setIsDeleteDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
      )}
      <div className="flex flex-col-reverse sm:flex-row ml-auto gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          type="button"
          onClick={onClose}
          disabled={isSaving || isDeleting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={form.handleSubmit(handleFormSubmit)}
          disabled={isSaving || isDeleting}
          className="w-full sm:w-auto"
        >
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update Module"
              : "Add Module"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ModalDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={isEditMode ? "Edit Group Module" : "Add Group Module"}
        description={
          isEditMode
            ? "Update the module details for this group."
            : "Add a new module to this group."
        }
        footerContent={footerContent}
        maxWidth="600px"
        fullHeight={false}
      >
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control as Control<GroupModuleFormValues>}
                name="strModuleGUID"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Module <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      disabled={isSaving || isLoadingModules || isEditMode}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={`${
                            form.formState.errors.strModuleGUID
                              ? "border-destructive"
                              : "border-input"
                          }`}
                        >
                          <SelectValue placeholder="Select a module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-45 overflow-y-auto z-50">
                        {modulesData.map((module) => (
                          <SelectItem
                            key={module.strModuleGUID}
                            value={module.strModuleGUID}
                          >
                            {module.strName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-destructive text-xs font-medium" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as Control<GroupModuleFormValues>}
                name="intVersion"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">
                      Version <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        disabled={isSaving}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? "" : parseInt(value, 10)
                          );
                        }}
                        className={` ${
                          form.formState.errors.intVersion
                            ? "border-destructive"
                            : "border-input"
                        }`}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-0.5">
                      Enter the module version number (minimum 1)
                    </FormDescription>
                    <FormMessage className="text-destructive text-xs font-medium" />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Group Module"
        description="Are you sure you want to delete this module from the group? This action cannot be undone."
        isLoading={isDeleting}
      />
    </>
  );
};

export default GroupModuleModal;
