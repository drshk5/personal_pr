import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  Plus,
  Eye,
  Trash2,
  Users,
  Star,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useAddOpportunityContact, useRemoveOpportunityContact } from "@/hooks/api/CRM/use-opportunities";
import { useContacts } from "@/hooks/api/CRM/use-contacts";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import type { OpportunityContactDto } from "@/types/CRM/opportunity";
import { OPPORTUNITY_CONTACT_ROLES } from "@/types/CRM/opportunity";

interface OpportunityContactsTabProps {
  opportunityId: string;
  contacts: OpportunityContactDto[];
  canEdit: boolean;
}

const ROLE_ICONS: Record<string, any> = {
  DecisionMaker: ShieldCheck,
  Influencer: Star,
  Champion: Star,
  Stakeholder: UserCircle,
  EndUser: Users,
};

const ROLE_COLORS: Record<string, string> = {
  DecisionMaker: "bg-red-500",
  Influencer: "bg-purple-500",
  Champion: "bg-amber-500",
  Stakeholder: "bg-blue-500",
  EndUser: "bg-gray-500",
};

export default function OpportunityContactsTab({
  opportunityId,
  contacts,
  canEdit,
}: OpportunityContactsTabProps) {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const removeMutation = useRemoveOpportunityContact();

  const handleRemove = async (contactId: string) => {
    if (confirm("Remove this contact from the opportunity?")) {
      try {
        await removeMutation.mutateAsync({
          opportunityId,
          contactId,
        });
      } catch (error: any) {
        toast.error(error?.message || "Failed to remove contact");
      }
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Linked Contacts ({contacts.length})
            </CardTitle>
            {canEdit && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No contacts linked to this opportunity.</p>
              {canEdit && (
                <p className="text-sm mt-2">
                  Click 'Add Contact' to link a contact.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Primary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const RoleIcon = ROLE_ICONS[contact.strRole] || UserCircle;
                  return (
                    <TableRow key={contact.strContactGUID}>
                      <TableCell className="font-medium">
                        {contact.strContactName || contact.strContactGUID}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            ROLE_COLORS[contact.strRole] || "bg-gray-500"
                          } text-white`}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {contact.strRole}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.bolIsPrimary && (
                          <Badge className="bg-green-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(
                                `/crm/contacts/${contact.strContactGUID}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() =>
                                handleRemove(contact.strContactGUID)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddContactDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        opportunityId={opportunityId}
        existingContactIds={contacts.map((c) => c.strContactGUID)}
      />
    </>
  );
}

function AddContactDialog({
  open,
  onClose,
  opportunityId,
  existingContactIds,
}: {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  existingContactIds: string[];
}) {
  const addMutation = useAddOpportunityContact();
  const { data: contactsData } = useContacts({ pageSize: 200 });
  const allContacts = Array.isArray(contactsData?.data)
    ? contactsData.data
    : (contactsData?.data as any)?.items || (contactsData as any)?.items || [];
  const availableContacts = allContacts.filter(
    (c: any) => !existingContactIds.includes(c.strContactGUID)
  );

  const [selectedContact, setSelectedContact] = useState("");
  const [role, setRole] = useState("Stakeholder");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      toast.error("Please select a contact");
      return;
    }
    try {
      await addMutation.mutateAsync({
        opportunityId,
        data: {
          strContactGUID: selectedContact,
          strRole: role,
          bolIsPrimary: isPrimary,
        },
      });
      onClose();
      setSelectedContact("");
      setRole("Stakeholder");
      setIsPrimary(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to add contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact to Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={selectedContact}
                onValueChange={setSelectedContact}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map((c: any) => (
                    <SelectItem
                      key={c.strContactGUID}
                      value={c.strContactGUID}
                    >
                      {c.strFirstName} {c.strLastName} — {c.strEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_CONTACT_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(!!checked)}
              />
              <Label htmlFor="isPrimary">Primary Contact</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
