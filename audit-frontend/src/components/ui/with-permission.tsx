import { Fragment } from "react";
import {
  usePermission,
  type ModuleName,
  type ActionType,
} from "@/lib/permissions";

interface WithPermissionProps {
  module: ModuleName;
  action: ActionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  hideOnDeny?: boolean;
}

export function WithPermission({
  module,
  action,
  children,
  fallback,
  hideOnDeny = true,
}: WithPermissionProps) {
  const hasPermission = usePermission(module, action);

  if (hasPermission) {
    return <Fragment>{children}</Fragment>;
  }

  if (hideOnDeny) {
    return null;
  }

  return <Fragment>{fallback}</Fragment>;
}
