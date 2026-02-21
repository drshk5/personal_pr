import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Building2, Globe, Users2, DollarSign, Calendar, MapPin } from "lucide-react";
import { useUpdateAccount } from "@/hooks/api/CRM/use-accounts";
import type { AccountDetailDto } from "@/types/CRM/account";

interface AccountOverviewTabProps {
  account: AccountDetailDto;
}

export default function AccountOverviewTab({ account }: AccountOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    strAccountName: account.strAccountName,
    strIndustry: account.strIndustry || "",
    strPhone: account.strPhone || "",
    strEmail: account.strEmail || "",
    strWebsite: account.strWebsite || "",
    intEmployeeCount: account.intEmployeeCount || 0,
    dblAnnualRevenue: account.dblAnnualRevenue || 0,
    strAddress: account.strAddress || "",
    strCity: account.strCity || "",
    strState: account.strState || "",
    strCountry: account.strCountry || "",
    strPostalCode: account.strPostalCode || "",
    strDescription: account.strDescription || "",
  });

  const updateMutation = useUpdateAccount();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: account.strAccountGUID,
        data: formData,
      });
      setIsEditing(false);
    } catch {
      // Error notification is handled centrally in the mutation hook.
    }
  };

  const handleCancel = () => {
    setFormData({
      strAccountName: account.strAccountName,
      strIndustry: account.strIndustry || "",
      strPhone: account.strPhone || "",
      strEmail: account.strEmail || "",
      strWebsite: account.strWebsite || "",
      intEmployeeCount: account.intEmployeeCount || 0,
      dblAnnualRevenue: account.dblAnnualRevenue || 0,
      strAddress: account.strAddress || "",
      strCity: account.strCity || "",
      strState: account.strState || "",
      strCountry: account.strCountry || "",
      strPostalCode: account.strPostalCode || "",
      strDescription: account.strDescription || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left Column - Account Information */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Account Information</CardTitle>
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={formData.strAccountName}
                    onChange={(e) =>
                      setFormData({ ...formData, strAccountName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.strIndustry}
                    onChange={(e) => setFormData({ ...formData, strIndustry: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <PhoneInput
                      value={formData.strPhone || ""}
                      onChange={(value) => setFormData({ ...formData, strPhone: value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.strEmail}
                      onChange={(e) => setFormData({ ...formData, strEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.strWebsite}
                    onChange={(e) => setFormData({ ...formData, strWebsite: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Employee Count</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      value={formData.intEmployeeCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          intEmployeeCount: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="annualRevenue">Annual Revenue</Label>
                    <Input
                      id="annualRevenue"
                      type="number"
                      value={formData.dblAnnualRevenue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dblAnnualRevenue: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </>
            ) : ( 
              <div className="space-y-3">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Industry" value={account.strIndustry} />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Website" value={account.strWebsite} link />
                <InfoRow icon={<Users2 className="h-4 w-4" />} label="Employees" value={account.intEmployeeCount?.toString()} />
                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Annual Revenue" value={account.dblAnnualRevenue ? `$${account.dblAnnualRevenue.toLocaleString()}` : undefined} />
                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Created" value={new Date(account.dtCreatedOn).toLocaleDateString()} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.strAddress}
                    onChange={(e) => setFormData({ ...formData, strAddress: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.strCity}
                      onChange={(e) => setFormData({ ...formData, strCity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.strState}
                      onChange={(e) => setFormData({ ...formData, strState: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.strPostalCode}
                      onChange={(e) =>
                        setFormData({ ...formData, strPostalCode: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <CountrySelect
                      value={formData.strCountry || ""}
                      onChange={(value) => setFormData({ ...formData, strCountry: value })}
                      placeholder="Select country"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  {account.strAddress && <p>{account.strAddress}</p>}
                  {(account.strCity || account.strState || account.strPostalCode) && (
                    <p>
                      {account.strCity}
                      {account.strCity && account.strState && ", "}
                      {account.strState} {account.strPostalCode}
                    </p>
                  )}
                  {account.strCountry && <p>{account.strCountry}</p>}
                  {!account.strAddress && !account.strCity && !account.strCountry && (
                    <p className="text-muted-foreground">No address provided</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Description & Statistics */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={formData.strDescription}
                onChange={(e) => setFormData({ ...formData, strDescription: e.target.value })}
                rows={8}
                placeholder="Add account description..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {account.strDescription || "No description provided"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <span className="text-sm font-medium">Total Activities</span>
              <Badge variant="secondary">{account.intActivityCount || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <span className="text-sm font-medium">Overdue Activities</span>
              <Badge variant="destructive">{account.intOverdueActivityCount || 0}</Badge>
            </div>
            {account.dtLastActivityOn && (
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <span className="text-sm font-medium">Last Activity</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(account.dtLastActivityOn).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={account.bolIsActive ? "success" : "secondary"}>
                {account.bolIsActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  link?: boolean;
}

function InfoRow({ icon, label, value, link }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {link && value ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}
