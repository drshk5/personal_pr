"use client";

import * as React from "react";
import {
  Monitor,
  Moon,
  Paintbrush,
  Palette,
  Radius,
  Sliders,
  Sun,
  X,
} from "lucide-react";

import { useThemeColor } from "@/hooks";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  ThemeProvider as ThemeProviderInternal,
  useTheme,
} from "@/contexts/theme/theme-provider";

export const ThemeProvider = ThemeProviderInternal;

type TabType = "appearance" | "colors" | "interface";

interface ThemeToggleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ThemeToggle({
  open: controlledOpen,
  onOpenChange,
}: ThemeToggleProps = {}) {
  const { theme, setTheme } = useTheme();
  const {
    colorScheme,
    setColorScheme,
    availableColorSchemes,
    getColorForScheme,
  } = useThemeColor();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const [borderRadius, setBorderRadius] = React.useState(() => {
    return parseInt(localStorage?.getItem("border-radius") || "10", 10);
  });

  const [activeTab, setActiveTab] = React.useState<TabType>("appearance");

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty("--radius", `${borderRadius}px`);
    localStorage.setItem("border-radius", borderRadius.toString());
  }, [borderRadius]);

  React.useEffect(() => {
    const root = window.document.documentElement;

    const updateBorderColor = () => {
      const isDarkMode = root.classList.contains("dark");
      if (isDarkMode) {
        // Dark mode: always transparent
        root.style.setProperty("--border-color", "transparent");
      } else {
        // Light mode: always colored
        root.style.setProperty("--border-color", "oklch(0.922 0 0)");
      }
    };

    updateBorderColor();

    const timeoutId = setTimeout(updateBorderColor, 50);

    return () => clearTimeout(timeoutId);
  }, [theme]);

  return (
    <div className="fixed right-6 bottom-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-95 p-0 overflow-y-auto"
          data-tour="theme-switcher-content"
        >
          <div className="flex flex-col h-full">
            <div className="bg-card px-6 py-5 border-b border-border-color sticky top-0 z-10">
              <div className="flex items-start justify-between gap-4">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center text-xl font-semibold">
                    <Palette className="mr-3 h-6 w-6 text-primary" />
                    Customize Theme
                  </SheetTitle>
                  <SheetDescription className="text-base mt-1">
                    Customize your interface appearance
                  </SheetDescription>
                </SheetHeader>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Close"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card border-b border-border-color px-6 py-2 sticky top-21.25 z-10">
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "appearance" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("appearance")}
                >
                  <Monitor className="h-4 w-4" />
                  <span>Appearance</span>
                </Button>
                <Button
                  variant={activeTab === "colors" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("colors")}
                >
                  <Paintbrush className="h-4 w-4" />
                  <span>Colors</span>
                </Button>
                <Button
                  variant={activeTab === "interface" ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setActiveTab("interface")}
                >
                  <Sliders className="h-4 w-4" />
                  <span>Interface</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 px-6 py-6">
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <section className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-base text-foreground flex items-center">
                        <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
                        <span>Display Mode</span>
                      </h3>
                      <span className="text-xs capitalize bg-primary/15 px-2 py-1 rounded-md text-primary font-medium">
                        {theme}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className={`justify-start h-auto py-3 px-3 w-full transition-all ${
                          theme === "light"
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                        {theme === "light" && (
                          <span className="ml-auto bg-primary-foreground/20 text-primary-foreground text-xs font-medium py-0.5 px-1.5 rounded-sm">
                            Active
                          </span>
                        )}
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className={`justify-start h-auto py-3 px-3 w-full transition-all ${
                          theme === "dark"
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                        {theme === "dark" && (
                          <span className="ml-auto bg-primary-foreground/20 text-primary-foreground text-xs font-medium py-0.5 px-1.5 rounded-sm">
                            Active
                          </span>
                        )}
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className={`justify-start h-auto py-3 px-3 w-full transition-all ${
                          theme === "system"
                            ? "text-primary-foreground"
                            : "text-foreground"
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>System</span>
                        {theme === "system" && (
                          <span className="ml-auto bg-primary-foreground/20 text-primary-foreground text-xs font-medium py-0.5 px-1.5 rounded-sm">
                            Active
                          </span>
                        )}
                      </Button>
                    </div>

                    <div className="p-5 bg-muted/30 rounded-lg border border-border-color mt-4">
                      <p className="text-sm text-center text-muted-foreground">
                        Choose how you'd like the interface to appear. Light
                        mode is brighter, dark mode reduces eye strain in low
                        light, and system mode follows your device settings.
                      </p>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "colors" && (
                <div className="space-y-6">
                  <section>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-medium text-foreground">
                        Choose a theme
                      </h3>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full capitalize">
                        {colorScheme}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {availableColorSchemes.map((scheme) => {
                        const color = getColorForScheme(scheme);
                        const isSelected = colorScheme === scheme;
                        return (
                          <div
                            key={scheme}
                            className={`cursor-pointer group flex flex-col items-center p-2 rounded-lg transition-all
                              ${
                                isSelected
                                  ? "bg-muted shadow-sm"
                                  : "hover:bg-muted/50"
                              }
                            `}
                            onClick={() => setColorScheme(scheme)}
                          >
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-all ${
                                isSelected
                                  ? "ring-2 ring-ring ring-offset-2 dark:ring-offset-background"
                                  : "group-hover:ring-1 group-hover:ring-ring group-hover:ring-offset-1 dark:group-hover:ring-offset-background"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                            <span className="mt-2 capitalize text-xs font-medium text-foreground truncate w-full text-center">
                              {scheme}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "interface" && (
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-base text-foreground flex items-center">
                        <Radius className="mr-2 h-4 w-4" />
                        <span>Border Radius</span>
                      </h3>
                      <span className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded-md">
                        {borderRadius}px
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[0, 4, 8, 12, 16, 24].map((radius) => (
                        <Button
                          key={radius}
                          variant={
                            borderRadius === radius ? "default" : "outline"
                          }
                          className="h-auto py-3 px-2 transition-all flex flex-col items-center gap-2"
                          onClick={() => setBorderRadius(radius)}
                        >
                          <div
                            className={`w-8 h-8 ${
                              borderRadius === radius
                                ? "bg-primary-foreground"
                                : "bg-primary"
                            } transition-colors`}
                            style={{ borderRadius: `${radius}px` }}
                          />
                          <span className="text-xs">{radius}px</span>
                        </Button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="p-5 bg-muted/30 rounded-lg border border-border-color">
                      <p className="text-sm text-center text-muted-foreground">
                        Border styling is automatically managed based on your
                        theme:
                        <br />
                        <strong>Light Mode:</strong> Borders are visible and
                        colored
                        <br />
                        <strong>Dark Mode:</strong> Borders are transparent for
                        a cleaner look
                      </p>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="bg-card px-6 py-4 border-t border-border-color text-center text-xs text-muted-foreground mt-auto">
              Changes are automatically saved
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
