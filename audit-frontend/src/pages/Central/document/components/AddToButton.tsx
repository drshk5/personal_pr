import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { Document } from "@/types/central/document";
import type { DocumentModule } from "@/types/central/document-module";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddToButtonProps {
  document: Document;
  isDeleted: boolean;
  modules: DocumentModule[];
  isLoadingModules: boolean;
  onAddToEntity: (
    moduleGUID: string,
    moduleName: string,
    documentGUID: string
  ) => void;
}

export const AddToButton: React.FC<AddToButtonProps> = ({
  document,
  isDeleted,
  modules,
  isLoadingModules,
  onAddToEntity,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-end add-to-action-cell"
      role="cell"
      aria-label="Add document to entity action"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {!isDeleted && (
        <div
          className={`add-to-button-wrapper transition-all duration-200 ease-in-out ${
            isDropdownOpen
              ? "opacity-100"
              : "opacity-0 group-hover/row:opacity-100"
          }`}
          role="group"
          aria-label={`Add ${document.strFileName} to entity`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <DropdownMenu onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-sm font-normal hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={isLoadingModules}
              >
                {isLoadingModules ? "Loading..." : "Add to"}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isLoadingModules ? (
                <DropdownMenuItem disabled>Loading modules...</DropdownMenuItem>
              ) : modules && modules.length > 0 ? (
                modules.map((module) => (
                  <DropdownMenuItem
                    key={module.strDocumentModuleGUID}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToEntity(
                        module.strDocumentModuleGUID,
                        module.strModuleName,
                        document.strDocumentGUID
                      );
                    }}
                  >
                    {module.strModuleName}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No modules available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
