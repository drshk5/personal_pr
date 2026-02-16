import { useEffect, useState, useMemo } from "react";
import { Calendar as CalendarIcon, Clock, User, Info } from "lucide-react";
import { useAuthContext, useUserRights } from "@/hooks";

import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CustomContainer from "@/components/layout/custom-container";
import { AppTour } from "@/components/shared/app-tour";

export default function UserWelcome() {
  const { user } = useAuthContext();
  const { menuItems } = useUserRights();
  const [date] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [greeting, setGreeting] = useState<string>("");
  const [showTour, setShowTour] = useState<boolean>(false);

  const hasMenuItems = menuItems && menuItems.length > 0;

  const tourSteps = useMemo(() => {
    const steps = [
      {
        element: ".welcome-header",
        popover: {
          title: "Welcome Message",
          description:
            "This shows your personalized greeting and current time.",
          side: "bottom" as const,
        },
      },
      {
        element: ".account-info",
        popover: {
          title: "Account Information",
          description:
            "View your account details and organization information here.",
          side: "right" as const,
        },
      },
      {
        element: ".calendar-section",
        popover: {
          title: "Calendar",
          description: "Check important dates and schedule your tasks.",
          side: "left" as const,
        },
      },
      {
        element: "[data-tour='module-switcher']",
        popover: {
          title: "Module Switcher",
          description:
            "Switch between different modules like Account, Task, and Central. Click here to see all available modules.",
          side: "bottom" as const,
        },
      },
      {
        element: "[data-tour='organization-switcher']",
        popover: {
          title: "Organization Switcher",
          description:
            "Switch between organizations and financial years. Select the organization and year you want to work with.",
          side: "right" as const,
        },
      },
      {
        element: "[data-tour='user-settings']",
        popover: {
          title: "User Settings",
          description:
            "Access your profile, settings, and account options. Customize your interface appearance. Choose between light, dark, or system theme, and adjust colors and interface settings. You can also log out from here.",
          side: "left" as const,
        },
      },
    ];

    return steps;
  }, []);

  useEffect(() => {
    if (user?.strLastOrganizationName) {
      document.title = `${user.strLastOrganizationName} | ${
        user.strLastModuleName || "Welcome"
      }`;
    }
  }, [user]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());

      const hour = now.getHours();
      if (hour < 12) {
        setGreeting("Good Morning");
      } else if (hour < 17) {
        setGreeting("Good Afternoon");
      } else {
        setGreeting("Good Evening");
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <CustomContainer>
      <div className="flex flex-col space-y-6">
        <section className="welcome-header relative overflow-hidden bg-linear-to-r from-primary/20 via-primary/10 to-background rounded-md shadow-sm shrink-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {greeting},{" "}
                  <span className="text-primary">{user?.strName}</span>!
                </h1>
                {user?.strLastModuleName && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    Welcome to the {user.strLastModuleDesc}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                <div className="flex items-center justify-center bg-background/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-border-color w-fit">
                  <Clock
                    className="h-5 w-5 text-primary mr-2"
                    aria-hidden="true"
                  />
                  <p className="font-mono text-xl text-foreground">
                    {currentTime}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTour(true)}
                  className="bg-background/70 backdrop-blur-sm md:w-auto"
                >
                  <Info className="h-4 w-4 mr-2" />
                  Take Tour
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 grow overflow-hidden">
          <div className="lg:col-span-4">
            <Card className="account-info overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full">
              <div className="bg-linear-to-r from-primary/40 to-primary/20 px-6 py-4">
                <h2 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </h2>
              </div>

              <div className="p-6 bg-card h-[calc(100%-60px)] overflow-auto">
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="border-b border-border-color pb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Name
                    </p>
                    <p className="font-semibold text-lg">{user?.strName}</p>
                  </div>

                  <div className="border-b border-border-color pb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="font-semibold">{user?.strEmailId}</p>
                  </div>

                  {user?.strUserRoleName && (
                    <div className="border-b border-border-color pb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Role
                      </p>
                      <p className="font-semibold">{user.strUserRoleName}</p>
                    </div>
                  )}

                  {user?.strGroupName && (
                    <div className="border-b border-border-color pb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Group/Parent
                      </p>
                      <p className="font-semibold">{user.strGroupName}</p>
                    </div>
                  )}

                  {user?.strLastOrganizationName && (
                    <div className="border-b border-border-color pb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Organization/Company
                      </p>
                      <p className="font-semibold">
                        {user.strLastOrganizationName}
                      </p>
                    </div>
                  )}

                  {user?.strLastModuleDesc && (
                    <div className="border-b border-border-color pb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Current Module
                      </p>
                      <p className="font-semibold">{user?.strLastModuleDesc}</p>
                    </div>
                  )}

                  {user?.strTimeZone && (
                    <div className="pb-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Timezone
                      </p>
                      <p className="font-semibold">{user.strTimeZone}</p>
                    </div>
                  )}
                </div>

                {!hasMenuItems && (
                  <div className="mt-6 bg-yellow-50/50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-yellow-100 p-2 shrink-0">
                        <Info className="h-5 w-5 text-yellow-800" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                          Access Notice
                        </h3>
                        <p className="text-yellow-800">
                          You currently don't have any assigned access rights in
                          the system. Please contact your administrator.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="calendar-section overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full mt-6 lg:mt-0">
              <div className="bg-linear-to-r from-primary/40 to-primary/20 px-6 py-4">
                <h2 className="text-xl font-bold text-primary-foreground flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Calendar
                </h2>
              </div>

              <div className="p-6 flex flex-col bg-card h-[calc(100%-60px)]">
                <div className="text-xl font-bold text-primary bg-primary/10 px-5 py-3 rounded-lg mb-4 shadow-sm border-2 border-primary/20 ring-2 ring-primary/10 w-fit mx-auto">
                  {date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className=" p-2 rounded-lg grow flex mt-8 items-center justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    defaultMonth={date}
                    className="scale-120 [&_button]:pointer-events-none"
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <AppTour
        steps={tourSteps}
        startTour={showTour}
        onTourComplete={() => setShowTour(false)}
      />
    </CustomContainer>
  );
}
