import type { MenuItem, Permission } from "@/types/central/user-rights";
import { useUserRights } from "@/hooks";

export const ModuleBase = {
  ORGANIZATION: "organization",
  USER: "user",
  USER_ROLE: "user_role",
  USER_PRIVILEGE: "user_privilege",
  YEAR: "year",
  PICKLIST_VALUE: "picklist_value",
  MASTER_MENU: "master-menu",
  MENU: "menu",
  ACCOUNT: "account",
  BANK: "bank",
  ITEM: "item",
  UNIT: "unit",
  PAYMENT_RECEIPT: "payment_receipt",
  PAYMENT_RECEIVED: "payment_received",
  PAYMENT_MADE: "payment_made",
  CUSTOMER: "customer",
  CHART_OF_ACCOUNT: "chart_of_account",
  AUDIT: "audit",
  DOC_TYPE: "doc_type",
  BOARD: "board",
  BOARD_MODULE: "module",
  SUB_MODULE: "sub_module",
  ASSIGN_TASK: "assign_task",
  MY_TASK: "my_task",
  ALL_TASKS: "all_tasks",
  REVIEW_TASK: "review_task",
  JOURNAL_VOUCHER: "journal_voucher",
  JOURNAL_VOUCHER_RECURRING: "journal_voucher_recurring",
  JOURNAL_VOUCHER_RECURRING_PROFILE: "journal_voucher_recurring_profile",
  INVOICE: "invoice",
  PURCHASE_INVOICE: "purchase_invoice",
  DOCUMENT: "document",
  USER_HOURLY_RATE: "user_hourly_rate",
  DESIGNATION: "designation",
  DEPARTMENT: "department",
  LEDGER_REPORT: "ledger_report",
  TRIAL_BALANCE: "trial_balance",
  BALANCE_SHEET: "balance_sheet",
  PROFIT_AND_LOSS: "profit_and_loss",
  OPENING_BALANCE: "opening_balance",
  CRM_LEAD: "crm_lead",
  CRM_CONTACT: "crm_contact",
  CRM_ACCOUNT: "crm_account",
  CRM_ACTIVITY: "crm_activity",
  CRM_OPPORTUNITY: "crm_opportunity",
  CRM_PIPELINE: "crm_pipeline",
} as const;

export const ListModules = {
  ORGANIZATION: `${ModuleBase.ORGANIZATION}_list`,
  USER: `${ModuleBase.USER}_list`,
  USER_ROLE: `${ModuleBase.USER_ROLE}_list`,
  PICKLIST_VALUE: `${ModuleBase.PICKLIST_VALUE}_list`,
  ACCOUNT: `${ModuleBase.ACCOUNT}_list`,
  BANK: `${ModuleBase.BANK}_list`,
  ITEM: `${ModuleBase.ITEM}_list`,
  UNIT: `${ModuleBase.UNIT}_list`,
  PAYMENT_RECEIPT: `${ModuleBase.PAYMENT_RECEIPT}_list`,
  PAYMENT_RECEIVED: `${ModuleBase.PAYMENT_RECEIVED}_list`,
  PAYMENT_MADE: `${ModuleBase.PAYMENT_MADE}_list`,
  CUSTOMER: `${ModuleBase.CUSTOMER}_list`,
  AUDIT: `${ModuleBase.AUDIT}_list`,
  DOC_TYPE: `${ModuleBase.DOC_TYPE}_list`,
  JOURNAL_VOUCHER: `${ModuleBase.JOURNAL_VOUCHER}_list`,
  JOURNAL_VOUCHER_RECURRING: `${ModuleBase.JOURNAL_VOUCHER_RECURRING}_list`,
  JOURNAL_VOUCHER_RECURRING_PROFILE: `${ModuleBase.JOURNAL_VOUCHER_RECURRING_PROFILE}_list`,
  INVOICE: `${ModuleBase.INVOICE}_list`,
  PURCHASE_INVOICE: `${ModuleBase.PURCHASE_INVOICE}_list`,
  BOARD: `${ModuleBase.BOARD}_list`,
  BOARD_MODULE: ModuleBase.BOARD_MODULE,
  SUB_MODULE: `${ModuleBase.SUB_MODULE}_list`,
  USER_HOURLY_RATE: `${ModuleBase.USER_HOURLY_RATE}_list`,
  LEDGER_REPORT: `${ModuleBase.LEDGER_REPORT}_list`,
  TRIAL_BALANCE: `${ModuleBase.TRIAL_BALANCE}_list`,
  BALANCE_SHEET: `${ModuleBase.BALANCE_SHEET}_list`,
  PROFIT_AND_LOSS: `${ModuleBase.PROFIT_AND_LOSS}_list`,
  OPENING_BALANCE: `${ModuleBase.OPENING_BALANCE}_list`,
  CRM_LEAD: `${ModuleBase.CRM_LEAD}_list`,
  CRM_CONTACT: `${ModuleBase.CRM_CONTACT}_list`,
  CRM_ACCOUNT: `${ModuleBase.CRM_ACCOUNT}_list`,
  CRM_ACTIVITY: `${ModuleBase.CRM_ACTIVITY}_list`,
  CRM_OPPORTUNITY: `${ModuleBase.CRM_OPPORTUNITY}_list`,
  CRM_PIPELINE: `${ModuleBase.CRM_PIPELINE}_list`,
} as const;

export const FormModules = {
  ORGANIZATION: `${ModuleBase.ORGANIZATION}_form`,
  USER: `${ModuleBase.USER}_form`,
  USER_ROLE: `${ModuleBase.USER_ROLE}_form`,
  PICKLIST_VALUE: `${ModuleBase.PICKLIST_VALUE}_form`,
  ACCOUNT: `${ModuleBase.ACCOUNT}_form`,
  ITEM: `${ModuleBase.ITEM}_form`,
  BANK: `${ModuleBase.BANK}_form`,
  UNIT: `${ModuleBase.UNIT}_form`,
  PAYMENT_RECEIPT: `${ModuleBase.PAYMENT_RECEIPT}_form`,
  PAYMENT_RECEIVED: `${ModuleBase.PAYMENT_RECEIVED}_form`,
  PAYMENT_MADE: `${ModuleBase.PAYMENT_MADE}_form`,
  CUSTOMER: `${ModuleBase.CUSTOMER}_form`,
  AUDIT: `${ModuleBase.AUDIT}_form`,
  DOC_TYPE: `${ModuleBase.DOC_TYPE}_form`,
  JOURNAL_VOUCHER: `${ModuleBase.JOURNAL_VOUCHER}_form`,
  JOURNAL_VOUCHER_RECURRING: `${ModuleBase.JOURNAL_VOUCHER_RECURRING}_form`,
  JOURNAL_VOUCHER_RECURRING_PROFILE: `${ModuleBase.JOURNAL_VOUCHER_RECURRING_PROFILE}_form`,
  INVOICE: `${ModuleBase.INVOICE}_form`,
  PURCHASE_INVOICE: `${ModuleBase.PURCHASE_INVOICE}_form`,
  BOARD: `${ModuleBase.BOARD}_form`,
  BOARD_MODULE: `${ModuleBase.BOARD_MODULE}_form`,
  SUB_MODULE_FORM: `${ModuleBase.SUB_MODULE}_form`,
  USER_HOURLY_RATE: `${ModuleBase.USER_HOURLY_RATE}_form`,
  OPENING_BALANCE: `${ModuleBase.OPENING_BALANCE}_form`,
  CRM_LEAD: `${ModuleBase.CRM_LEAD}_form`,
  CRM_CONTACT: `${ModuleBase.CRM_CONTACT}_form`,
  CRM_ACCOUNT: `${ModuleBase.CRM_ACCOUNT}_form`,
  CRM_ACTIVITY: `${ModuleBase.CRM_ACTIVITY}_form`,
  CRM_OPPORTUNITY: `${ModuleBase.CRM_OPPORTUNITY}_form`,
  CRM_PIPELINE: `${ModuleBase.CRM_PIPELINE}_form`,
} as const;

export const SpecialModules = {
  ORGANIZATION_TEAM: "organization_team",
  USER_PRIVILEGE: ModuleBase.USER_PRIVILEGE,
  MASTER_MENU: ModuleBase.MASTER_MENU,
  MENU: ModuleBase.MENU,
  CHART_OF_ACCOUNT: ModuleBase.CHART_OF_ACCOUNT,
  MASTER: "master",
  HRM: "hrm",
  DOC_NO: "doc_no",
  DOCUMENT: ModuleBase.DOCUMENT,
} as const;

export const Modules = {
  ...ModuleBase,
  ...ListModules,
  ...FormModules,
  ...SpecialModules,
} as const;

export const Actions = {
  VIEW: "view",
  EDIT: "edit",
  SAVE: "save",
  DELETE: "delete",
  PRINT: "print",
  EXPORT: "export",
  APPROVE: "approve",
} as const;

export type ActionType = (typeof Actions)[keyof typeof Actions];
export type ModuleName = string;

const actionToPermissionMap: Record<ActionType, keyof Permission> = {
  [Actions.VIEW]: "bolCanView",
  [Actions.EDIT]: "bolCanEdit",
  [Actions.SAVE]: "bolCanSave",
  [Actions.DELETE]: "bolCanDelete",
  [Actions.PRINT]: "bolCanPrint",
  [Actions.EXPORT]: "bolCanExport",
  [Actions.APPROVE]: "bolCanApprove",
};

export function canAccess(
  menuItems: MenuItem[] | undefined,
  moduleName: string,
  action: ActionType
): boolean {
  const permissionProperty = actionToPermissionMap[action];

  if (menuItems) {
    for (const menuItem of menuItems) {
      const menuMapKey = menuItem.strMapKey?.toLowerCase();
      if (
        menuMapKey &&
        menuMapKey === moduleName.toLowerCase() &&
        menuItem.permission
      ) {
        if (menuItem.permission[permissionProperty]) {
          return true;
        }
      }
    }
  }

  return false;
}

export function usePermission(moduleName: string, action: ActionType): boolean {
  const { menuItems } = useUserRights();
  return canAccess(menuItems, moduleName, action);
}

export function useCanEdit(moduleName: string): boolean {
  const { menuItems } = useUserRights();
  return canAccess(menuItems, moduleName, Actions.EDIT);
}

export function useCanView(moduleName: string): boolean {
  const { menuItems } = useUserRights();
  return canAccess(menuItems, moduleName, Actions.VIEW);
}

export function useCanSave(moduleName: string): boolean {
  const { menuItems } = useUserRights();
  return canAccess(menuItems, moduleName, Actions.SAVE);
}

export function useCanDelete(moduleName: string): boolean {
  const { menuItems } = useUserRights();
  return canAccess(menuItems, moduleName, Actions.DELETE);
}
