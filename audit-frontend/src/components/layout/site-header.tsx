import { useState } from "react";
import { useAuthContext } from "@/hooks";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import { useDocumentMode } from "@/hooks/common/use-document-mode";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { CircleHelp } from "lucide-react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

import { ModuleSwitcherModal } from "@/components/navigation/module-switcher-modal";
import { NotificationDropdown } from "@/components/navigation/notification-dropdown";
import { PageSearch } from "@/components/navigation/page-search";
import { HelpCenterWidget } from "@/components/navigation/help-center-widget";

export function SiteHeader() {
  const { user } = useAuthContext();
  const { isSwitchingModule, isSwitchingOrg } = useContextSwitches();
  const { isDocMode } = useDocumentMode();
  const isMobile = useIsMobile();
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);

  const currentModuleDesc = user?.strLastModuleDesc;
  const currentModuleName = user?.strLastModuleName;

  const isLoading = isSwitchingModule || isSwitchingOrg;

  const isTaskModule = currentModuleName === "Task";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background transition-[width,height] ease-linear">
      <div className="flex items-center gap-2 px-4">
        {(!isDocMode || (isDocMode && isMobile)) && (
          <SidebarTrigger className="-ml-1 hover:bg-gray-200 dark:hover:bg-gray-900" />
        )}
        {isLoading ? (
          <span className="font-medium text-muted-foreground animate-pulse">
            Loading module...
          </span>
        ) : currentModuleDesc ? (
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {currentModuleDesc}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 px-4 ml-auto">
        <PageSearch className="max-w-10 sm:max-w-sm" />

        {isTaskModule && (
          <>
            <NotificationDropdown />
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHelpCenterOpen(true)}
          className="h-9 w-9 hover:bg-gray-200 dark:hover:bg-gray-900"
          title="Help Center"
        >
          <CircleHelp className="size-5" />
        </Button>

        <ModuleSwitcherModal />
      </div>

      <HelpCenterWidget
        open={helpCenterOpen}
        onOpenChange={setHelpCenterOpen}
      />
    </header>
  );
}
