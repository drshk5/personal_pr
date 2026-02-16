import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Trash2, FileText } from "lucide-react";

import {
  useUpsertRenameSchedule,
  useDeleteRenameSchedule,
} from "@/hooks/api/Account/use-rename-schedules";

import { Modules, Actions } from "@/lib/permissions";

import type { RenameSchedule } from "@/types/central/rename-schedule";

import { WithPermission } from "@/components/ui/with-permission";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  strRenameScheduleName: z.string().min(1, "Chart of account name is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface RenameScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;

  renameSchedule: RenameSchedule;
}

export function RenameScheduleModal({
  isOpen,
  onClose,
  renameSchedule,
}: RenameScheduleModalProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [originalName, setOriginalName] = useState<string>("");

  const deleteMutation = useDeleteRenameSchedule();
  const upsertMutation = useUpsertRenameSchedule();

  const isSubmitting = upsertMutation.isPending || deleteMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      strRenameScheduleName:
        renameSchedule.strRenameScheduleName || renameSchedule.strScheduleName,
    },
  });

  const currentName = form.watch("strRenameScheduleName");

  useEffect(() => {
    const name =
      renameSchedule.strRenameScheduleName || renameSchedule.strScheduleName;
    setOriginalName(name);
    form.reset({
      strRenameScheduleName: name,
    });
  }, [renameSchedule, form]);

  const onSubmit = async (data: FormValues) => {
    if (data.strRenameScheduleName !== originalName) {
      await upsertMutation.mutateAsync({
        strRenameScheduleGUID: renameSchedule.strRenameScheduleGUID,
        strRenameScheduleName: data.strRenameScheduleName,
        strScheduleGUID: renameSchedule.strScheduleGUID,
      });
    }

    form.reset();
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (
      renameSchedule.strRenameScheduleGUID !==
      "00000000-0000-0000-0000-000000000000"
    ) {
      await deleteMutation.mutateAsync(renameSchedule.strRenameScheduleGUID);
      setIsDeleteDialogOpen(false);
      onClose();
    }
  };

  // Create the footer content for the ModalDialog
  const footerContent = (
    <>
      {renameSchedule.strRenameScheduleGUID !==
        "00000000-0000-0000-0000-000000000000" && (
        <WithPermission
          module={Modules.CHART_OF_ACCOUNT}
          action={Actions.DELETE}
        >
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isSubmitting}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </WithPermission>
      )}
      <div className="flex ml-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="mr-2"
        >
          Cancel
        </Button>
        <WithPermission module={Modules.CHART_OF_ACCOUNT} action={Actions.SAVE}>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || currentName === originalName}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </WithPermission>
      </div>
    </>
  );

  return (
    <>
      <ModalDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        title="Edit Chart of Account Schedule"
        description="Rename this chart of account schedule to better reflect its purpose."
        footerContent={footerContent}
        maxWidth="500px"
      >
        <Form {...form}>
          <div className="px-6 py-4">
            <FormField
              control={form.control}
              name="strRenameScheduleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Chart of Account Name{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter a name for the chart of account"
                        className="h-9 pl-8"
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </ModalDialog>

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Confirm Deletion"
        description={`This will permanently delete the chart of account "${
          renameSchedule.strRenameScheduleName || renameSchedule.strScheduleName
        }". This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
