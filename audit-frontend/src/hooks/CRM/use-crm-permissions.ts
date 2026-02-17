import { useAuthContext } from "@/hooks/common/use-auth-context";
import { usePermission, Actions, ListModules, FormModules } from "@/lib/permissions";

export type CrmModule =
  | "lead"
  | "contact"
  | "account"
  | "opportunity"
  | "activity"
  | "pipeline";

const MODULE_LIST_MAP: Record<CrmModule, string> = {
  lead: ListModules.CRM_LEAD,
  contact: ListModules.CRM_CONTACT,
  account: ListModules.CRM_ACCOUNT,
  opportunity: ListModules.CRM_OPPORTUNITY,
  activity: ListModules.CRM_ACTIVITY,
  pipeline: ListModules.CRM_PIPELINE,
};

const MODULE_FORM_MAP: Record<CrmModule, string> = {
  lead: FormModules.CRM_LEAD,
  contact: FormModules.CRM_CONTACT,
  account: FormModules.CRM_ACCOUNT,
  opportunity: FormModules.CRM_OPPORTUNITY,
  activity: FormModules.CRM_ACTIVITY,
  pipeline: FormModules.CRM_PIPELINE,
};

export interface CrmPermissions {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  isAdmin: boolean;
  currentUserGUID: string | undefined;
  currentUserName: string | undefined;
}

export function useCrmPermissions(module: CrmModule): CrmPermissions {
  const { user } = useAuthContext();

  const listModule = MODULE_LIST_MAP[module];
  const formModule = MODULE_FORM_MAP[module];

  const canViewList = usePermission(listModule, Actions.VIEW);
  const canEditForm = usePermission(formModule, Actions.EDIT);
  const canSaveForm = usePermission(formModule, Actions.SAVE);
  const canDeleteForm = usePermission(formModule, Actions.DELETE);
  const canExportList = usePermission(listModule, Actions.EXPORT);
  const canImportList = usePermission(listModule, Actions.IMPORT);

  const isAdmin = user?.bolIsSuperAdmin ?? false;

  return {
    canView: canViewList || isAdmin,
    canEdit: canEditForm || isAdmin,
    canCreate: canSaveForm || isAdmin,
    canDelete: canDeleteForm || isAdmin,
    canExport: canExportList || isAdmin,
    canImport: canImportList || isAdmin,
    isAdmin,
    currentUserGUID: user?.strUserGUID,
    currentUserName: user?.strName,
  };
}

/**
 * Check if user can access data: admin sees all, regular users see only assigned
 */
export function useCanAccessRecord(
  module: CrmModule,
  assignedToGUID?: string | null
): { canViewRecord: boolean; canEditRecord: boolean; isOwner: boolean } {
  const perms = useCrmPermissions(module);
  const isOwner = !!perms.currentUserGUID && perms.currentUserGUID === assignedToGUID;

  return {
    canViewRecord: perms.isAdmin || perms.canView || isOwner,
    canEditRecord: perms.isAdmin || perms.canEdit || isOwner,
    isOwner,
  };
}
