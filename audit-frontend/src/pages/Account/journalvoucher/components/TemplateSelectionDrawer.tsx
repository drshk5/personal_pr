import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Edit, Trash2 } from "lucide-react";
import { 
  useJournalVoucherTemplatesDropdown, 
  useDeleteJournalVoucherTemplate 
} from "@/hooks/api/Account/use-journal-voucher-template";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TemplateSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (templateGuid: string) => void;
  onContinueToPost?: () => void;
}

const TemplateSelectionDrawer: React.FC<TemplateSelectionDrawerProps> = ({
  open,
  onOpenChange,
  onTemplateSelect,
  onContinueToPost,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{
    guid: string;
    name: string;
  } | null>(null);
  const {
    data: templates,
    isLoading,
    error,
  } = useJournalVoucherTemplatesDropdown(
    { search: searchQuery.trim() || undefined },
    { enabled: open }
  );

  const deleteTemplateMutation = useDeleteJournalVoucherTemplate();

  const handleTemplateClick = (templateGuid: string) => {
    onTemplateSelect(templateGuid);
    onOpenChange(false);
  };

  const handleEditTemplate = (
    e: React.MouseEvent,
    templateGuid: string
  ) => {
    e.stopPropagation();
    onOpenChange(false);
    navigate(`/journal-voucher/${templateGuid}?is_journal_template=true`);
  };

  const handleDeleteTemplate = (
    e: React.MouseEvent,
    templateGuid: string,
    templateName: string
  ) => {
    e.stopPropagation();
    setTemplateToDelete({ guid: templateGuid, name: templateName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplateMutation.mutateAsync(templateToDelete.guid);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleCreateTemplate = () => {
    navigate("/journal-voucher/new?is_journal_template=true");
    onOpenChange(false);
  };

  // Reset search query when drawer closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-sm p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-border-color">
          <SheetTitle>Choose Template</SheetTitle>
          <SheetDescription>
            Select a journal voucher template to apply to this voucher, or
            continue without a template.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="template-search">Search Templates</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="template-search"
                  type="text"
                  placeholder="Search by template name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive text-sm">
                    Failed to load templates. Please try again.
                  </p>
                </div>
              ) : templates && templates.length > 0 ? (
                <>
                  <div className="text-xs text-muted-foreground">
                    {templates.length} template
                    {templates.length !== 1 ? "s" : ""} found
                  </div>
                  {templates.map((template) => (
                    <Card
                      key={template.strJournal_Voucher_TemplateGUID}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border-border"
                      onClick={() => handleTemplateClick(template.strJournal_Voucher_TemplateGUID)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate mb-1">
                              {template.strTemplateName}
                            </h4>
                            {template.strNotes && (
                              <p className="text-xs text-muted-foreground truncate mb-2">
                                {template.strNotes}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Amount: {template.dblTotalAmount.toFixed(2)}
                              </span>
                              <span>Items: {template.intItemCount}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) =>
                                  handleEditTemplate(
                                    e,
                                    template.strJournal_Voucher_TemplateGUID
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4 " />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) =>
                                  handleDeleteTemplate(
                                    e,
                                    template.strJournal_Voucher_TemplateGUID,
                                    template.strTemplateName
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <p className="text-sm">
                        No templates found matching "{searchQuery}"
                      </p>
                      <p className="text-xs mt-2">
                        Try a different search term
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">No templates available</p>
                      <p className="text-xs mt-2">
                        Create a new template to get started
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border-color px-6 py-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCreateTemplate}
            className="w-full sm:w-auto flex-1"
          >
            Create New Template
          </Button>
          <div className="flex w-full sm:w-auto gap-2">
            {onContinueToPost && (
              <Button
                onClick={onContinueToPost}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              >
                Continue to Post
              </Button>
            )}
          </div>
        </div>
      </SheetContent>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Template"
        description={`Are you sure you want to delete the template "${templateToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteTemplateMutation.isPending}
      />
    </Sheet>
  );
};

export default TemplateSelectionDrawer;
