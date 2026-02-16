import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import type { MenuPage } from "@/types/central/menu";

import { cn } from "@/lib/utils";
import { getIconByName } from "@/lib/icon-map";

import { useDebounce } from "@/hooks/common/use-debounce";
import { useSearchPages } from "@/hooks/api";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface PageSearchProps {
  className?: string;
}

export function PageSearch({ className }: PageSearchProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const {
    data: menuPages,
    isLoading,
    refetch,
  } = useSearchPages(debouncedSearchQuery, { enabled: open });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    } else {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      refetch();
    }
  }, [open, refetch]);

  const availablePages: MenuPage[] =
    menuPages?.filter(
      (item: MenuPage) =>
        item &&
        item.strPath &&
        !item.strPath.includes("separator") &&
        item.strMenuPosition !== "hidden"
    ) || [];

  const filteredPages: MenuPage[] = availablePages;

  const handleSelect = (path: string) => {
    if (path) {
      navigate(path);
      setOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-muted-foreground border-border border hover:text-sidebar-accent-foreground transition-colors px-3 py-1.5 w-full rounded-md bg-transparent hover:bg-sidebar-accent text-sm"
        title="Search pages (Ctrl+K)"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left hidden sm:inline">
          Search pages...
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border-color bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search Pages</DialogTitle>
        <DialogContent className="p-0 gap-0 w-[90vw] sm:w-[80vw] md:max-w-2xl lg:max-w-3xl">
          <div className="flex flex-col">
            <div className="bg-card p-3 sm:p-4 rounded-t-lg border-b border-border-color sticky top-0 z-10">
              <div className="relative flex items-center">
                <div className="absolute left-2 top-0 bottom-0 flex items-center">
                  <Search className="h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search all pages..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border border-border-color rounded-md bg-background pl-8 h-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none "
                />
              </div>
            </div>

            <div className="p-2 max-h-[50vh] sm:max-h-[60vh] md:max-h-87.5 overflow-y-auto">
              {isLoading ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : debouncedSearchQuery && filteredPages.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No pages found
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-2 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground">
                    Available Pages
                  </div>
                  <div className="mt-1">
                    {filteredPages.map((page: MenuPage) => {
                      const path = page.strPath;
                      const IconComponent =
                        getIconByName(page.strIconName || "") || Search;

                      return (
                        <div
                          key={page.strMenuGUID}
                          className="flex items-center px-2 py-2 sm:py-1.5 text-sm text-foreground rounded-sm cursor-pointer hover:bg-muted active:bg-muted/80"
                          onClick={() => handleSelect(path)}
                        >
                          <div className="mr-2 flex items-center justify-center text-muted-foreground">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="flex-1 truncate text-sm">
                            {page.strName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
