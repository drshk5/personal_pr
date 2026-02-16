import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "../input";

// Define Select props
const Select = SelectPrimitive.Root;
Select.displayName = "Select";

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "flex shadow-xs h-10 w-full items-center justify-between rounded-md border border-border-color px-3 py-2 text-sm transition-all",
      "placeholder:text-muted-foreground text-foreground",
      "hover:border-border-color hover:shadow-sm",
      "focus-visible:outline-none focus-visible:border-border-color focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-0",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:border-border-color",

      // Light mode styles
      "bg-white",
      "disabled:bg-white/50",

      // Dark mode styles
      "dark:bg-white/10",
      "dark:focus-visible:ring-border-color/20",
      "dark:disabled:bg-white/3",

      // Validation
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// Add showSearch and searchPlaceholder to SelectContent props
interface SelectContentProps extends React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Content
> {
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
}

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(
  (
    {
      className,
      children,
      position = "popper",
      showSearch,
      searchPlaceholder = "Search...",
      onSearchChange,
      ...props
    },
    ref
  ) => {
    // Local state for search input
    const [searchValue, setSearchValue] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Call onSearchChange when search value changes
    React.useEffect(() => {
      if (onSearchChange) {
        onSearchChange(searchValue);
      }
    }, [searchValue, onSearchChange]);

    // Extract text content from children for search
    const getTextFromItem = React.useCallback(
      (item: React.ReactNode): string => {
        if (typeof item === "string") return item;
        if (typeof item === "number") return String(item);
        if (React.isValidElement(item)) {
          const props = item.props as Record<string, React.ReactNode>; // Better type for props

          // Recursively get text from children
          if (props && props.children) {
            return getTextFromItem(props.children);
          }
          if (props && props.value !== undefined) {
            return String(props.value);
          }
        }
        return "";
      },
      []
    );

    // Focus the search input when dropdown opens
    React.useEffect(() => {
      if (showSearch && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }
    }, [showSearch]);

    // Filter children based on search input
    const filteredChildren = React.useMemo(() => {
      if (!showSearch || !searchValue.trim()) {
        return children;
      }

      const lowerSearchValue = searchValue.toLowerCase();

      return React.Children.map(children, (child) => {
        // Handle non-element children
        if (!React.isValidElement(child)) {
          return child;
        }

        // Handle SelectGroup (recursively filter its children)
        if (child.type === SelectGroup) {
          const childProps = child.props as Record<string, React.ReactNode>;
          const filteredGroupChildren = React.Children.map(
            childProps.children,
            (groupChild) => {
              if (!React.isValidElement(groupChild)) {
                return null;
              }

              if (groupChild.type === SelectPrimitive.Item) {
                const groupChildProps = groupChild.props as Record<
                  string,
                  React.ReactNode
                >;
                const text = getTextFromItem(
                  groupChildProps.children
                ).toLowerCase();
                return text.includes(lowerSearchValue) ? groupChild : null;
              }

              return groupChild; // Keep other elements like labels
            }
          );

          // Filter out null/undefined children
          const nonNullChildren = filteredGroupChildren?.filter(Boolean) || [];

          // Return null if no children match (to hide empty groups)
          if (nonNullChildren.length === 0) {
            return null;
          }

          // Clone group with filtered children
          return React.cloneElement(child, {}, ...nonNullChildren);
        }

        // Handle direct SelectItem
        if (child.type === SelectPrimitive.Item) {
          const childProps = child.props as Record<string, React.ReactNode>;
          const text = getTextFromItem(childProps.children).toLowerCase();
          return text.includes(lowerSearchValue) ? child : null;
        }

        // Keep other child types as is (like SelectLabel)
        return child;
      });
    }, [children, searchValue, showSearch, getTextFromItem]);

    return (
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={ref}
          className={cn(
            "relative z-9999 min-w-32 overflow-hidden rounded-md border border-border-color bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            className
          )}
          position={position}
          {...props}
        >
          {showSearch && (
            <div className="sticky top-0 p-2 z-101 bg-background border-b border-border-color">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-102" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  className="pl-8 h-8 w-full bg-background dark:bg-[#121212] text-foreground dark:text-white placeholder:text-muted-foreground relative z-101"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    // Prevent dropdown from closing on Enter
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
          )}
          <SelectPrimitive.Viewport
            className={cn(
              "p-1 max-h-62.5 overflow-y-auto",
              position === "popper" &&
                "w-full min-w-(--radix-select-trigger-width)"
            )}
          >
            {filteredChildren}
            {showSearch &&
              searchValue &&
              React.Children.toArray(filteredChildren).filter(Boolean)
                .length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground dark:text-white/70">
                  No matches found for "{searchValue}"
                </div>
              )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    );
  }
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-sm font-semibold dark:text-white",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-[#f0f0f0] dark:focus:bg-[#333] dark:focus:text-white",
      "data-highlighted:bg-[#f0f0f0] dark:data-highlighted:bg-[#333]",
      "dark:text-white",
      "data-disabled:pointer-events-none data-disabled:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted dark:bg-[#333]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
