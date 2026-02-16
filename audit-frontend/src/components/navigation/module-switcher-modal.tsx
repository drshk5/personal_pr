import { useState } from "react";
import { Grip } from "lucide-react";
import { getModuleImagePath } from "@/lib/utils";
import { useAuthContext } from "@/hooks";
import {
  useUserModules,
  useSwitchModule,
} from "@/hooks/api/central/use-modules";
import { useContextSwitches } from "@/hooks/common/use-context-switches";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";

interface ModuleSwitcherModalProps {
  className?: string;
}

interface ModuleItemProps {
  module: {
    strModuleGUID: string;
    strModuleName: string;
    strImagePath?: string;
  };
  isActive: boolean;
  isPending: boolean;
  onSwitch: (moduleGUID: string) => void;
}

function ModuleItem({
  module,
  isActive,
  isPending,
  onSwitch,
}: ModuleItemProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = getModuleImagePath(module.strImagePath);

  return (
    <div
      className={`flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all border border-border-color ${
        isActive
          ? "bg-gray-300 dark:bg-gray-700"
          : "hover:bg-gray-200 dark:hover:bg-gray-900"
      } ${isPending ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => onSwitch(module.strModuleGUID)}
    >
      <div className="mb-4">
        {imageSrc && !imageError ? (
          <div
            className={`w-20 h-20 rounded-lg overflow-hidden ${
              isActive ? "" : ""
            } transition-all`}
          >
            <LazyImage
              src={imageSrc}
              alt={module.strModuleName}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full rounded-lg"
              placeholderClassName="rounded-lg"
              loading="lazy"
              threshold={100}
              rootMargin="50px"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div
            className={`w-20 h-20 flex items-center justify-center rounded-lg text-2xl font-semibold ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            } transition-all`}
          >
            {module.strModuleName.charAt(0)}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="font-medium text-base text-foreground">
          {module.strModuleName}
        </div>
      </div>
    </div>
  );
}

export function ModuleSwitcherModal({ className }: ModuleSwitcherModalProps) {
  const [open, setOpen] = useState(false);
  const { mutate: switchModule, isPending } = useSwitchModule();
  const { user } = useAuthContext();
  const { isSwitchingModule, isSwitchingOrg } = useContextSwitches();

  const { data: modulesResponse, isLoading: isModulesLoading } = useUserModules(
    { enabled: !!user }
  );
  const modules = modulesResponse?.data || [];

  // Get current module ID from user context
  const currentModuleId = user?.strLastModuleGUID || "";

  // Combined loading state
  const isLoading =
    isPending || isSwitchingModule || isSwitchingOrg || isModulesLoading;

  const handleModuleSwitch = (moduleGUID: string) => {
    if (moduleGUID !== currentModuleId) {
      switchModule(moduleGUID);
      setOpen(false);
    }
  }; // Only show the button if there are multiple modules to switch between
  if (modules.length <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <Button
        variant="ghost"
        size="icon"
        disabled={isLoading}
        onClick={() => setOpen(true)}
        className="hover:bg-gray-200 dark:hover:bg-gray-900"
        data-tour="module-switcher"
      >
        {isLoading ? (
          <span className="size-5 rounded-full border-2 border-t-gray-600 dark:border-t-gray-400 border-border-color dark:border-gray-700 animate-spin" />
        ) : (
          <Grip className="size-5" />
        )}
        <span className="sr-only">App Modules</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Switch Modules</DialogTitle>
        <DialogContent className="p-0 gap-0 max-w-4xl mx-auto w-[90vw] overflow-hidden border-border-color">
          <div className="flex flex-col">
            {/* Header */}
            <div className="bg-card p-6 border-b border-border-color sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-foreground">
                Switch Module
              </h2>
            </div>

            {/* Modules Grid */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {modules.map((module) => {
                  const isActive = module.strModuleGUID === currentModuleId;
                  return (
                    <ModuleItem
                      key={module.strModuleGUID}
                      module={module}
                      isActive={isActive}
                      isPending={isPending}
                      onSwitch={handleModuleSwitch}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
