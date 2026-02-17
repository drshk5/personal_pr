import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Mail, Phone, Edit, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContacts, useCreateContact } from "@/hooks/api/CRM/use-contacts";
import { toast } from "sonner";
import type { CreateContactDto, CONTACT_LIFECYCLE_STAGES } from "@/types/CRM/contact";

interface AccountContactsTabProps {
  accountId: string;
  accountName: string;
}

export default function AccountContactsTab({
  accountId,
  accountName,
}: AccountContactsTabProps) {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contactsData, isLoading } = useContacts({
    strAccountGUID: accountId,
    pageSize: 100,
  });

  const contacts = Array.isArray(contactsData?.data)
    ? contactsData.data
    : (contactsData?.data as any)?.items || (contactsData?.data as any)?.Items || (contactsData as any)?.items || (contactsData as any)?.Items || [];
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.strFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.strLastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.strEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts ({contacts.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "No contacts found matching your search"
                : "No contacts yet. Click 'New Contact' to add one."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Lifecycle Stage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.strContactGUID}>
                    <TableCell className="font-medium">
                      {contact.strFirstName} {contact.strLastName}
                    </TableCell>
                    <TableCell>
                      {contact.strEmail ? (
                        <a
                          href={`mailto:${contact.strEmail}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.strEmail}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.strPhone ? (
                        <a
                          href={`tel:${contact.strPhone}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.strPhone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{contact.strJobTitle || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.strLifecycleStage}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/crm/contacts/${contact.strContactGUID}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/crm/contacts/${contact.strContactGUID}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateContactDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        accountId={accountId}
        accountName={accountName}
      />
    </>
  );
}

interface CreateContactDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

function CreateContactDialog({
  open,
  onClose,
  accountId,
  accountName,
}: CreateContactDialogProps) {
  const createMutation = useCreateContact();
  const [formData, setFormData] = useState<CreateContactDto>({
    strFirstName: "",
    strLastName: "",
    strEmail: "",
    strPhone: "",
    strJobTitle: "",
    strLifecycleStage: "Lead",
    strAccountGUID: accountId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Contact created successfully");
      onClose();
      setFormData({
        strFirstName: "",
        strLastName: "",
        strEmail: "",
        strPhone: "",
        strJobTitle: "",
        strLifecycleStage: "Lead",
        strAccountGUID: accountId,
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create contact");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Contact for {accountName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.strFirstName}
                  onChange={(e) =>
                    setFormData({ ...formData, strFirstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.strLastName}
                  onChange={(e) =>
                    setFormData({ ...formData, strLastName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.strEmail}
                  onChange={(e) => setFormData({ ...formData, strEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.strPhone || ""}
                  onChange={(e) => setFormData({ ...formData, strPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.strJobTitle || ""}
                  onChange={(e) => setFormData({ ...formData, strJobTitle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycleStage">Lifecycle Stage</Label>
                <Select
                  value={formData.strLifecycleStage}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      strLifecycleStage: value as typeof CONTACT_LIFECYCLE_STAGES[number],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Subscriber">Subscriber</SelectItem>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="MQL">MQL</SelectItem>
                    <SelectItem value="SQL">SQL</SelectItem>
                    <SelectItem value="Opportunity">Opportunity</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Evangelist">Evangelist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
