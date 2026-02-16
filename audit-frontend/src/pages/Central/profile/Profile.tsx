import { useState } from "react";
import { User, Pencil, ArrowLeft } from "lucide-react";

import { useAuthContext } from "@/hooks/common/use-auth-context";
import { useUser } from "@/hooks/api/central/use-users";

import { formatTimeToAmPm, getImagePath } from "@/lib/utils";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/pages/Central/profile/ProfileForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/ui/shadcn-io/status";
import { LazyImage } from "@/components/ui/lazy-image";

export default function Profile() {
  const { user: authUser } = useAuthContext();
  const { data: user, isLoading } = useUser(
    authUser?.bolIsSuperAdmin ? undefined : authUser?.strUserGUID
  );
  const [isEditing, setIsEditing] = useState(false);

  const activeUser = authUser?.bolIsSuperAdmin ? authUser : user;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  return (
    <CustomContainer>
      <PageHeader
        title="User Profile"
        description="View and manage your personal information"
        icon={User}
        actions={
          isEditing ? (
            <Button variant="outline" onClick={handleEditToggle}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={handleEditToggle}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )
        }
      />

      {isLoading && !authUser?.bolIsSuperAdmin ? (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading user information...</p>
        </div>
      ) : activeUser ? (
        <>
          {isEditing ? (
            <ProfileForm onUpdateComplete={handleEditToggle} />
          ) : (
            <Card>
              <CardContent className="p-6 pt-6">
                <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                  <div className="relative w-32 h-32 overflow-hidden rounded-full border-4 border-background shadow-md shrink-0">
                    {activeUser.strProfileImg ? (
                      <LazyImage
                        src={getImagePath(activeUser.strProfileImg) || ""}
                        alt={`${activeUser.strName}'s profile picture`}
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full rounded-full"
                        placeholderClassName="rounded-full"
                        loading="lazy"
                        threshold={100}
                        rootMargin="50px"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <User size={48} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="bg-none p-4 rounded-lg grow">
                    <h3 className="text-xl font-bold text-foreground">
                      {activeUser.strName}
                    </h3>
                    <p className="text-muted-foreground">
                      {activeUser.strEmailId}
                    </p>
                    {activeUser.strMobileNo && (
                      <p className="text-muted-foreground mt-1">
                        {activeUser.strMobileNo}
                      </p>
                    )}
                    <div className="mt-2 flex space-x-2">
                      <Status
                        status={activeUser.bolIsActive ? "online" : "offline"}
                      >
                        <StatusIndicator />
                        <StatusLabel>
                          {activeUser.bolIsActive ? "Active" : "Inactive"}
                        </StatusLabel>
                      </Status>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    Other Information
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {activeUser.dtBirthDate && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Date of Birth
                        </p>
                        <p className="font-medium text-foreground">
                          {new Date(
                            activeUser.dtBirthDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {activeUser.strTimeZone && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Timezone
                        </p>
                        <p className="font-medium text-foreground">
                          {activeUser.strTimeZone}
                        </p>
                      </div>
                    )}

                    {activeUser.dtWorkingStartTime && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Working Hours Start
                        </p>
                        <p className="font-medium text-foreground">
                          {formatTimeToAmPm(activeUser.dtWorkingStartTime)}
                        </p>
                      </div>
                    )}

                    {activeUser.dtWorkingEndTime && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Working Hours End
                        </p>
                        <p className="font-medium text-foreground">
                          {formatTimeToAmPm(activeUser.dtWorkingEndTime)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            User information not available
          </p>
        </div>
      )}
    </CustomContainer>
  );
}
