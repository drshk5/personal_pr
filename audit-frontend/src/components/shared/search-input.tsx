import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/common/use-debounce";

interface SearchInputProps {
  placeholder?: string;
  onSearchChange: (value: string) => void;
  debounceDelay?: number;
  className?: string;
  defaultValue?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  onSearchChange,
  debounceDelay = 500,
  className = "w-full sm:max-w-md sm:flex-1",
  defaultValue = "",
}) => {
  const [search, setSearch] = useState<string>(defaultValue);
  const debouncedSearch = useDebounce(search, debounceDelay);

  // Trigger callback when debounced value changes
  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleClear = () => {
    setSearch("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-9 w-full h-10"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <span className="sr-only">Clear search</span>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
