import React from "react";
import { useActiveUsers } from "@/hooks/api/central/use-users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UserAssignSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  /** If true, wraps in FormItem/FormLabel/FormMessage */
  withFormWrapper?: boolean;
}

/**
 * Reusable user assignment dropdown used across all CRM modules.
 * Uses standard Select component — same proven pattern as ActivityForm.
 */
const UserAssignSelect: React.FC<UserAssignSelectProps> = ({
  value,
  onChange,
  label = "Assigned To",
  withFormWrapper = true,
}) => {
  const { data: activeUsers } = useActiveUsers();

  const selectElement = (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {activeUsers?.map((user) => (
          <SelectItem key={user.strUserGUID} value={user.strUserGUID}>
            <div className="flex items-center gap-2">
              <span>{user.strName}</span>
              <span className="text-xs text-muted-foreground">
                {user.strEmailId}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (withFormWrapper) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        {selectElement}
        <FormMessage />
      </FormItem>
    );
  }

  return selectElement;
};

export default UserAssignSelect;
