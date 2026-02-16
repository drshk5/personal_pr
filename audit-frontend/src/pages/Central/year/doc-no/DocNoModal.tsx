import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { Trash2, Hash, FileText } from "lucide-react";

import type { DocNo, DocNoCreate, DocNoUpdate } from "@/types/Account/doc-no";
import {
  useCreateDocNo,
  useUpdateDocNo,
  useDeleteDocNo,
} from "@/hooks/api/Account/use-doc-no";

const docNoSchema = z.object({
  strDocumentTypeGUID: z
    .string({
      required_error: "Document type is required",
    })
    .min(1, "Document type is required"),
  intDigit: z
    .number({
      required_error: "Number of digits is required",
    })
    .int("Digit must be an integer")
    .min(1, "Digit must be at least 1")
    .max(10, "Digit must be at most 10"),
  strPrefix: z
    .string()
    .max(50, "Prefix must be less than 50 characters")
    .optional(),
  strSufix: z
    .string()
    .max(50, "Suffix must be less than 50 characters")
    .optional(),
  intStartNo: z
    .number({
      required_error: "Start number is required",
    })
    .int("Start number must be an integer")
    .min(1, "Start number must be at least 1")
    .max(999999, "Start number must be at most 999999"),
  intLastCreatedNo: z
    .number()
    .int("Last created number must be an integer")
    .min(0, "Last created number cannot be negative")
    .optional(),
});

type DocNoFormValues = z.infer<typeof docNoSchema>;

interface DocNoModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearId: string;
  docNo?: DocNo;
}

export const DocNoModal: React.FC<DocNoModalProps> = ({
  isOpen,
  onClose,
  yearId,
  docNo,
}) => {
  const isEditMode = !!docNo;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const { mutate: createDocNo, isPending: isCreating } = useCreateDocNo();
  const { mutate: updateDocNo, isPending: isUpdating } = useUpdateDocNo();
  const { mutate: deleteDocNo, isPending: isDeleting } = useDeleteDocNo();

  const isSaving = isCreating || isUpdating;

  const form = useForm<DocNoFormValues>({
    resolver: zodResolver(docNoSchema),
    defaultValues: {
      strDocumentTypeGUID: docNo?.strDocumentTypeGUID || "",
      intDigit: docNo?.intDigit || 3,
      strPrefix: docNo?.strPrefix || "",
      strSufix: docNo?.strSufix || "",
      intStartNo: docNo?.intStartNo || 1,
      intLastCreatedNo: docNo?.intLastCreatedNo || 0,
    },
  });

  React.useEffect(() => {
    if (docNo) {
      form.reset({
        strDocumentTypeGUID: docNo.strDocumentTypeGUID || "",
        intDigit: docNo.intDigit || 3,
        strPrefix: docNo.strPrefix || "",
        strSufix: docNo.strSufix || "",
        intStartNo: docNo.intStartNo || 1,
        intLastCreatedNo: docNo.intLastCreatedNo || 0,
      });
    } else {
      form.reset({
        strDocumentTypeGUID: "",
        intDigit: 3,
        strPrefix: "",
        strSufix: "",
        intStartNo: 1,
        intLastCreatedNo: 0,
      });
    }
  }, [docNo, yearId, form, isOpen]);

  const onSubmit = (data: DocNoFormValues) => {
    if (isEditMode && docNo) {
      const updateData: DocNoUpdate = {
        strDocumentTypeGUID: data.strDocumentTypeGUID,
        strYearGUID: yearId,
        intDigit: data.intDigit,
        strPrefix: data.strPrefix || undefined,
        strSufix: data.strSufix || undefined,
        intStartNo: data.intStartNo,
        intLastCreatedNo: data.intLastCreatedNo || docNo.intLastCreatedNo || 0,
      };

      updateDocNo(
        {
          strDocumentNoGUID: docNo.strDocumentNoGUID,
          ...updateData,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      const createData: DocNoCreate = {
        strDocumentTypeGUID: data.strDocumentTypeGUID,
        intDigit: data.intDigit,
        strPrefix: data.strPrefix || undefined,
        strSufix: data.strSufix || undefined,
        intStartNo: data.intStartNo,
      };

      createDocNo(createData, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const handleDeleteDocNo = () => {
    if (!docNo) return;

    deleteDocNo(docNo.strDocumentNoGUID, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        onClose();
      },
    });
  };

  const previewDocumentNumber = () => {
    const prefix = form.watch("strPrefix") || "";
    const digits = form.watch("intDigit") || 3;
    const startNo = form.watch("intStartNo") || 1;
    const suffix = form.watch("strSufix") || "";

    // Get year name from docNo if available, otherwise use default
    const yearName = docNo?.strYearName || "2024-25";

    // Convert year name to short format (e.g., "2024-25" -> "2425")
    const getShortYear = (yearString: string): string => {
      if (yearString.includes("-")) {
        const [startYear, endYear] = yearString.split("-");
        const shortStart = startYear.slice(-2);
        const shortEnd = endYear.slice(-2);
        return `${shortStart}${shortEnd}`;
      }
      return (
        yearString.slice(-2) +
        (parseInt(yearString.slice(-2)) + 1).toString().slice(-2)
      );
    };

    const shortYear = getShortYear(yearName);
    const formattedNumber = startNo.toString().padStart(digits, "0");

    return `${prefix}/${shortYear}/${formattedNumber}${suffix}`;
  };

  const footerContent = (
    <div className="flex justify-between w-full items-center">
      <div>
        {isEditMode && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isCreating || isUpdating}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" form="docNoForm" disabled={isSaving}>
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Creating..."
            : isEditMode
              ? "Update"
              : "Create"}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <ModalDialog
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        title={isEditMode ? "Edit Document Number" : "Add Document Number"}
        description={
          isEditMode
            ? "Update the document number configuration for this year."
            : "Add a new document number configuration to this year."
        }
        footerContent={footerContent}
        maxWidth="600px"
        fullHeight={false}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="docNoForm"
          >
            <div className="px-6 py-2">
              <FormField
                control={form.control}
                name="strDocumentTypeGUID"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Document Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        value={docNo?.strDocumentTypeName || ""}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="strPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prefix</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="INV-"
                            {...field}
                            value={field.value || ""}
                            className="pl-8"
                            disabled={isSaving}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="strSufix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suffix</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <FileText className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="-2025"
                            {...field}
                            value={field.value || ""}
                            className="pl-8"
                            disabled={isSaving}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="intDigit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Number of Digits <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="3"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                            className="pl-8"
                            disabled={isSaving}
                            min={1}
                            max={10}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="intStartNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Number <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 1)
                            }
                            className="pl-8"
                            disabled={isSaving}
                            min={1}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Document Number Preview</p>
                <p className="text-lg font-mono mt-1">
                  {previewDocumentNumber()}
                </p>
              </div>
            </div>
          </form>
        </Form>
      </ModalDialog>

      <DeleteConfirmationDialog
        title="Delete Document Number"
        description="Are you sure you want to delete this document number configuration? This action cannot be undone."
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteDocNo}
        isLoading={isDeleting}
      />
    </>
  );
};
