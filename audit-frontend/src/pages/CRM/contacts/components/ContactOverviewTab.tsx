import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  Edit,
  Save,
  X,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useUpdateContact } from "@/hooks/api/CRM/use-contacts";
import { toast } from "sonner";
import type { ContactDetailDto } from "@/types/CRM/contact";
import { CONTACT_LIFECYCLE_STAGES } from "@/types/CRM/contact";
import { format } from "date-fns";

interface ContactOverviewTabProps {
  contact: ContactDetailDto;
  canEdit: boolean;
}

export default function ContactOverviewTab({
  contact,
  canEdit,
}: ContactOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    strFirstName: contact.strFirstName,
    strLastName: contact.strLastName,
    strEmail: contact.strEmail,
    strPhone: contact.strPhone || "",
    strMobilePhone: contact.strMobilePhone || "",
    strJobTitle: contact.strJobTitle || "",
    strDepartment: contact.strDepartment || "",
    strLifecycleStage: contact.strLifecycleStage,
    strAddress: contact.strAddress || "",
    strCity: contact.strCity || "",
    strState: contact.strState || "",
    strCountry: contact.strCountry || "",
    strPostalCode: contact.strPostalCode || "",
    strNotes: contact.strNotes || "",
    strAccountGUID: contact.strAccountGUID || "",
  });

  const updateMutation = useUpdateContact();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: contact.strContactGUID,
        data: formData,
      });
      toast.success("Contact updated successfully");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update contact");
    }
  };

  const handleCancel = () => {
    setFormData({
      strFirstName: contact.strFirstName,
      strLastName: contact.strLastName,
      strEmail: contact.strEmail,
      strPhone: contact.strPhone || "",
      strMobilePhone: contact.strMobilePhone || "",
      strJobTitle: contact.strJobTitle || "",
      strDepartment: contact.strDepartment || "",
      strLifecycleStage: contact.strLifecycleStage,
      strAddress: contact.strAddress || "",
      strCity: contact.strCity || "",
      strState: contact.strState || "",
      strCountry: contact.strCountry || "",
      strPostalCode: contact.strPostalCode || "",
      strNotes: contact.strNotes || "",
      strAccountGUID: contact.strAccountGUID || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column - Contact Information */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Contact Information</CardTitle>
              {canEdit && !isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : canEdit && isEditing ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={formData.strFirstName}
                      onChange={(e) =>
                        setFormData({ ...formData, strFirstName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.strLastName}
                      onChange={(e) =>
                        setFormData({ ...formData, strLastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.strEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, strEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.strPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, strPhone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mobile Phone</Label>
                    <Input
                      value={formData.strMobilePhone}
                      onChange={(e) =>
                        setFormData({ ...formData, strMobilePhone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lifecycle Stage</Label>
                    <Select
                      value={formData.strLifecycleStage}
                      onValueChange={(v) =>
                        setFormData({ ...formData, strLifecycleStage: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_LIFECYCLE_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={formData.strJobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, strJobTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={formData.strDepartment}
                      onChange={(e) =>
                        setFormData({ ...formData, strDepartment: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <InfoRow
                  icon={User}
                  label="Name"
                  value={`${contact.strFirstName} ${contact.strLastName}`}
                />
                <InfoRow icon={Mail} label="Email" value={contact.strEmail} isLink linkType="email" />
                <InfoRow icon={Phone} label="Phone" value={contact.strPhone} isLink linkType="phone" />
                <InfoRow icon={Phone} label="Mobile" value={contact.strMobilePhone} isLink linkType="phone" />
                <InfoRow icon={Briefcase} label="Job Title" value={contact.strJobTitle} />
                <InfoRow icon={Building2} label="Department" value={contact.strDepartment} />
                <InfoRow icon={Building2} label="Account" value={contact.strAccountName} />
                <div className="flex items-center gap-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-28">Created</span>
                  <span className="text-sm">
                    {format(new Date(contact.dtCreatedOn), "PPP")}
                  </span>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground w-28">Last Contacted</span>
                  <span className="text-sm">
                    {contact.dtLastContactedOn
                      ? format(new Date(contact.dtLastContactedOn), "PPP")
                      : "Never"}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.strAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, strAddress: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.strCity}
                      onChange={(e) =>
                        setFormData({ ...formData, strCity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={formData.strState}
                      onChange={(e) =>
                        setFormData({ ...formData, strState: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      value={formData.strCountry}
                      onChange={(e) =>
                        setFormData({ ...formData, strCountry: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.strPostalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, strPostalCode: e.target.value })
                    }
                    className="w-48"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm">
                {contact.strAddress || contact.strCity || contact.strState ? (
                  <>
                    {contact.strAddress && <p>{contact.strAddress}</p>}
                    <p>
                      {[contact.strCity, contact.strState, contact.strPostalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {contact.strCountry && <p>{contact.strCountry}</p>}
                  </>
                ) : (
                  <p className="text-muted-foreground">No address on file</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Notes & Assigned */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Owner & Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <span className="text-sm font-medium">
                  {contact.strAssignedToName || "Unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lifecycle Stage</span>
                <Badge>{contact.strLifecycleStage}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={contact.bolIsActive ? "default" : "destructive"}>
                  {contact.bolIsActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.strNotes}
                onChange={(e) =>
                  setFormData({ ...formData, strNotes: e.target.value })
                }
                rows={6}
                placeholder="Add notes about this contact..."
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {contact.strNotes || "No notes yet."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  isLink,
  linkType,
}: {
  icon: any;
  label: string;
  value?: string | null;
  isLink?: boolean;
  linkType?: "email" | "phone";
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground w-28">{label}</span>
      {value ? (
        isLink ? (
          <a
            href={linkType === "email" ? `mailto:${value}` : `tel:${value}`}
            className="text-sm text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm">{value}</span>
        )
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </div>
  );
}
