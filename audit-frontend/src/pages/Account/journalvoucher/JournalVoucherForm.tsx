import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Book,
  Trash2,
  Settings,
  CheckCircle,
  Pencil,
  X,
  Repeat,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useJournalVoucher,
  useCreateJournalVoucher,
  useUpdateJournalVoucher,
  useDeleteJournalVoucher,
  useExchangeRate,
} from "@/hooks";
import {
  useJournalVoucherTemplate,
  useCreateJournalVoucherTemplate,
  useUpdateJournalVoucherTemplate,
  useDeleteJournalVoucherTemplate,
} from "@/hooks/api/Account/use-journal-voucher-template";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import { Actions, FormModules, usePermission } from "@/lib/permissions";
import { journalVoucherTemplateService } from "@/services/Account/journal-voucher-template.service";
import type {
  JournalVoucherCreate,
  JournalVoucherUpdate,
} from "@/types/Account/journal-voucher";
import type {
  JournalVoucherTemplateDetail,
  JournalVoucherTemplateCreate,
  JournalVoucherTemplateUpdate,
} from "@/types/Account/journal-voucher-template";
import type { JournalVoucherTemplateItemUpsert } from "@/types/Account/journal-voucher-template-item";
import type { JournalVoucherItem } from "@/types/Account/journal-voucher";
import type { AttachmentFile } from "@/types/common";

import {
  journalVoucherSchema,
  type JournalVoucherFormValues,
} from "@/validations/Account/journal-voucher";
import {
  journalVoucherTemplateSchema,
  type JournalVoucherTemplateFormValues,
} from "@/validations/Account/journal-voucher-template";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import NotFound from "@/components/error-boundaries/entity-not-found";
import { WithPermission } from "@/components/ui/with-permission";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { AttachmentManager } from "@/components/ui/attachments/AttachmentManager";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Separator } from "@/components/ui/separator";
import { JournalVoucherFormSkeleton } from "./JournalVoucherFormSkeleton";
import { JournalVoucherItemsTable } from "./components/JournalVoucherItemsTable";
import TemplateSelectionDrawer from "@/pages/Account/journalvoucher/components/TemplateSelectionDrawer";
import { RecurrenceSettings } from "./components/RecurrenceSettings";

const JournalVoucherForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showTemplateSelectionSheet, setShowTemplateSelectionSheet] =
    useState<boolean>(false);
  const [voucherItems, setVoucherItems] = useState<JournalVoucherItem[]>([]);
  const [templateItems, setTemplateItems] = useState<
    JournalVoucherTemplateItemUpsert[]
  >([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [removedJournalVoucherItemGUIDs, setRemovedJournalVoucherItemGUIDs] =
    useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<AttachmentFile[]>([]);

  const [selectedCurrencyGUID, setSelectedCurrencyGUID] = useState<string>("");
  const [isEditingExchangeRate, setIsEditingExchangeRate] = useState(false);
  const [customExchangeRate, setCustomExchangeRate] = useState<
    number | undefined
  >(undefined);
  const [submittingAs, setSubmittingAs] = useState<
    "Draft" | "Pending For Approval" | "Approved" | null
  >(null);
  const [showRecurrence, setShowRecurrence] = useState<boolean>(false);
  const recurrenceRef = useRef<HTMLDivElement>(null);
  const [originalCurrencyGUID, setOriginalCurrencyGUID] = useState<string>("");

  const handleMakeRecurring = () => {
    setShowRecurrence((isOpening) => {
      if (!isOpening) {
        const current = form.getValues("recurrence");
        if (!current) {
          form.setValue("recurrence", {
            strProfileName: "",
            strRepeatType: "Daily",
            intRepeatEveryValue: 1,
            strRepeatEveryUnit: "Day",
            intRepeatOnDay: null,
            strRepeatOnWeekday: null,
            strCustomFrequencyJson: null,
            dStartDate: new Date().toISOString().split("T")[0],
            dEndDate: null,
            bolNeverExpires: false,
          });
        }
      }
      return !isOpening;
    });
  };

  // Check if we're in template mode
  const isTemplateMode = searchParams.get("is_journal_template") === "true";
  const searchParamsString = searchParams.toString();
  const templateGuidParam = searchParams.get("template_guid");

  const handleSettingsClick = () => {
    if (user?.strLastYearGUID) {
      window.open(`/year/${user.strLastYearGUID}`, "_blank");
    }
  };

  const HeaderIcon = useMenuIcon(FormModules.JOURNAL_VOUCHER, Book);
  const { user } = useAuthContext();
  const isEditMode = !!id && id !== "new";
  const hasApproveRights = usePermission(
    FormModules.JOURNAL_VOUCHER,
    Actions.APPROVE
  );

  // Enable lazy fetch for create; prefetch for edit to fill existing values

  const { data: currencyTypes, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined);

  // Check if selected currency is different from user's currency
  const isDifferentCurrency =
    selectedCurrencyGUID && selectedCurrencyGUID !== user?.strCurrencyTypeGUID;

  // Journal Voucher hooks
  const {
    data: journalVoucher,
    isFetching: isFetchingVoucher,
    error: voucherError,
  } = useJournalVoucher(isEditMode && !isTemplateMode && id ? id : "");

  // Determine if form should be disabled (only Draft status can be edited in edit mode)
  const isFormDisabled =
    isEditMode && !isTemplateMode && journalVoucher?.strStatus !== "Draft";

  // Journal Voucher Template hooks
  const {
    data: journalVoucherTemplate,
    isFetching: isFetchingTemplate,
    error: templateError,
  } = useJournalVoucherTemplate(isEditMode && isTemplateMode && id ? id : "");

  // Fetch exchange rate when currency is different from user's currency
  // In edit mode, only fetch if currency changed and status is draft
  const shouldFetchExchangeRate =
    !!selectedCurrencyGUID &&
    selectedCurrencyGUID !== user?.strCurrencyTypeGUID &&
    (!isEditMode ||
      (isEditMode &&
        !isTemplateMode &&
        journalVoucher?.strStatus === "Draft" &&
        selectedCurrencyGUID !== originalCurrencyGUID));
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } =
    useExchangeRate(
      { strFromCurrencyGUID: selectedCurrencyGUID },
      {
        enabled: shouldFetchExchangeRate,
      }
    );

  const createMutation = useCreateJournalVoucher();
  const updateMutation = useUpdateJournalVoucher(
    isEditMode && !isTemplateMode ? id : undefined
  );
  const deleteMutation = useDeleteJournalVoucher();

  const createTemplateMutation = useCreateJournalVoucherTemplate();
  const updateTemplateMutation = useUpdateJournalVoucherTemplate(
    isEditMode && isTemplateMode ? id : undefined
  );
  const deleteTemplateMutation = useDeleteJournalVoucherTemplate();

  const currentSchema = isTemplateMode
    ? journalVoucherTemplateSchema
    : journalVoucherSchema;
  type CombinedFormValues = JournalVoucherFormValues &
    JournalVoucherTemplateFormValues;

  const form = useForm<CombinedFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(currentSchema as any),
    defaultValues: isTemplateMode
      ? {
          strTemplateName: "",
          strRefNo: "",
          strNotes: "",
          strCurrencyTypeGUID: "",
          bolIsJouranl_Adjustement: false,
        }
      : {
          dJournal_VoucherDate: new Date().toISOString().split("T")[0],
          strRefNo: "",
          strNotes: "",
          strCurrencyTypeGUID: "",
          strStatus: "Draft",
          bolIsJouranl_Adjustement: false,
          strReportingMethod: "Accrual and Cash",
        },
  });

  useEffect(() => {
    if (isEditMode && !isTemplateMode && journalVoucher) {
      form.reset({
        dJournal_VoucherDate: journalVoucher.dJournal_VoucherDate.substring(
          0,
          10
        ),
        strRefNo: journalVoucher.strRefNo || "",
        strNotes: journalVoucher.strNotes || "",
        strCurrencyTypeGUID: journalVoucher.strCurrencyTypeGUID || "",
        strStatus: journalVoucher.strStatus,
        bolIsJouranl_Adjustement:
          journalVoucher.bolIsJouranl_Adjustement ?? false,
        strReportingMethod:
          journalVoucher.strReportingMethod || "Accrual and Cash",
        recurrence: journalVoucher.recurringProfile
          ? {
              strProfileName: journalVoucher.recurringProfile.strProfileName,
              strRepeatType: journalVoucher.recurringProfile.strRepeatType,
              intRepeatEveryValue:
                journalVoucher.recurringProfile.intRepeatEveryValue,
              strRepeatEveryUnit:
                journalVoucher.recurringProfile.strRepeatEveryUnit,
              intRepeatOnDay: journalVoucher.recurringProfile.intRepeatOnDay,
              strRepeatOnWeekday:
                journalVoucher.recurringProfile.strRepeatOnWeekday,
              strCustomFrequencyJson:
                journalVoucher.recurringProfile.strCustomFrequencyJson,
              dStartDate: journalVoucher.recurringProfile.dStartDate.substring(
                0,
                10
              ),
              dEndDate: journalVoucher.recurringProfile.dEndDate
                ? journalVoucher.recurringProfile.dEndDate.substring(0, 10)
                : null,
              bolNeverExpires: journalVoucher.recurringProfile.bolNeverExpires,
            }
          : null,
      });
      // Set custom exchange rate from the saved journal voucher
      if (journalVoucher.dblExchangeRate) {
        setCustomExchangeRate(
          Number(journalVoucher.dblExchangeRate.toFixed(3))
        );
      }
      // Set original currency for tracking changes
      setOriginalCurrencyGUID(journalVoucher.strCurrencyTypeGUID || "");
      // Check if voucher has a recurring profile
      if (
        journalVoucher.strJournal_Voucher_RecurringProfileGUID ||
        journalVoucher.recurringProfile
      ) {
        setShowRecurrence(true);
      }
    } else if (isEditMode && isTemplateMode && journalVoucherTemplate) {
      form.reset({
        strTemplateName: journalVoucherTemplate.strTemplateName,
        strRefNo: journalVoucherTemplate.strRefNo || "",
        strNotes: journalVoucherTemplate.strNotes || "",
        strCurrencyTypeGUID: journalVoucherTemplate.strCurrencyTypeGUID || "",
        bolIsJouranl_Adjustement:
          journalVoucherTemplate.bolIsJouranl_Adjustement ?? false,
      });
    }
  }, [
    isEditMode,
    isTemplateMode,
    journalVoucher,
    journalVoucherTemplate,
    form,
  ]);

  // Sync selected currency with form value
  const watchedCurrency = form.watch("strCurrencyTypeGUID");

  useEffect(() => {
    if (watchedCurrency && watchedCurrency !== "null") {
      setSelectedCurrencyGUID(watchedCurrency);
    } else {
      setSelectedCurrencyGUID("");
    }
  }, [watchedCurrency]);

  // Default currency to user's currency for new vouchers (non-template)
  useEffect(() => {
    if (!isEditMode && !isTemplateMode && user?.strCurrencyTypeGUID) {
      const current = form.getValues("strCurrencyTypeGUID");
      if (!current) {
        form.setValue("strCurrencyTypeGUID", user.strCurrencyTypeGUID);
      }
    }
  }, [isEditMode, isTemplateMode, user?.strCurrencyTypeGUID, form]);

  // Keep exchange rate in sync whenever the API responds so items can refresh immediately.
  useEffect(() => {
    if (!exchangeRateData?.Rate || !isDifferentCurrency) return;
    setCustomExchangeRate(Number(exchangeRateData.Rate.toFixed(3)));
  }, [exchangeRateData, isDifferentCurrency]);

  // Set custom exchange rate from stored value in edit mode
  useEffect(() => {
    if (isEditMode && journalVoucher?.dblExchangeRate && !customExchangeRate) {
      setCustomExchangeRate(journalVoucher.dblExchangeRate);
    }
  }, [isEditMode, journalVoucher?.dblExchangeRate, customExchangeRate]);

  useEffect(() => {
    if (journalVoucher?.strFiles) {
      setExistingFiles(
        journalVoucher.strFiles.map((file) => ({
          ...file,
          strFileType: file.strFileType || "",
        })) as AttachmentFile[]
      );
    }
  }, [journalVoucher]);

  useEffect(() => {
    if (journalVoucher?.items) {
      setVoucherItems(
        journalVoucher.items.map((item) => ({
          ...item,
          dblDebit: item.dblDebit ?? 0,
          dblCredit: item.dblCredit ?? 0,
        })) as JournalVoucherItem[]
      );
    } else if (journalVoucherTemplate?.items) {
      setTemplateItems(
        journalVoucherTemplate.items.map((item) => ({
          ...item,
          dblDebit: item.dblDebit ?? 0,
          dblCredit: item.dblCredit ?? 0,
        }))
      );
    } else if (isTemplateMode && !isEditMode) {
      // Initialize template with 2 empty rows when creating new template
      setTemplateItems([
        {
          strJournal_Voucher_Template_ItemGUID: crypto.randomUUID(),
          intSeqNo: 1,
          strAccountGUID: "",
          strDesc: null,
          strRefNo: null,
          dblDebit: null,
          dblCredit: null,
          dblDebit_BaseCurrency: null,
          dblCredit_BaseCurrency: null,
        },
        {
          strJournal_Voucher_Template_ItemGUID: crypto.randomUUID(),
          intSeqNo: 2,
          strAccountGUID: "",
          strDesc: null,
          strRefNo: null,
          dblDebit: null,
          dblCredit: null,
          dblDebit_BaseCurrency: null,
          dblCredit_BaseCurrency: null,
        },
      ]);
    }
  }, [journalVoucher, journalVoucherTemplate, isTemplateMode, isEditMode]);

  useEffect(() => {
    if (isEditMode && isTemplateMode && templateItems.length > 0) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));

        window.scrollTo(0, 1);
        window.scrollTo(0, 0);

        requestAnimationFrame(() => {
          document.body.style.minHeight = "100%";
          void document.body.offsetHeight;
          document.body.style.minHeight = "";
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isEditMode, isTemplateMode, templateItems.length]);

  const populateVoucherFromTemplate = useCallback(
    (fullTemplate: JournalVoucherTemplateDetail) => {
      if (fullTemplate.items && fullTemplate.items.length > 0) {
        const voucherItemsFromTemplate: JournalVoucherItem[] =
          fullTemplate.items.map((item, index) => ({
            strJournal_Voucher_ItemGUID: null,
            strJournal_VoucherGUID: "",
            intSeqNo: index + 1,
            strAccountGUID: item.strAccountGUID || "",
            strAccountName: item.strAccountName || null,
            strDesc: item.strDesc,
            strRefNo: item.strRefNo,
            strNotes: null,
            strCurrencyTypeGUID: fullTemplate.strCurrencyTypeGUID,
            strCurrencyTypeName: null,
            dblDebit: item.dblDebit ?? 0,
            dblCredit: item.dblCredit ?? 0,
            strGroupGUID: "",
            strOrganizationGUID: "",
            strYearGUID: "",
            dtCreatedOn: new Date().toISOString(),
            strCreatedByGUID: null,
            strCreatedByName: null,
            dtUpdatedOn: new Date().toISOString(),
            strUpdatedByGUID: null,
            strUpdatedByName: null,
          }));
        setVoucherItems(voucherItemsFromTemplate);

        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
          window.scrollTo(0, 1);
          window.scrollTo(0, 0);
          requestAnimationFrame(() => {
            document.body.style.minHeight = "100%";
            void document.body.offsetHeight;
            document.body.style.minHeight = "";
          });
        }, 150);
      }

      if (fullTemplate.strCurrencyTypeGUID) {
        form.setValue("strCurrencyTypeGUID", fullTemplate.strCurrencyTypeGUID);
      }

      if (
        "strNotes" in fullTemplate &&
        typeof fullTemplate.strNotes === "string" &&
        fullTemplate.strNotes
      ) {
        form.setValue("strNotes", fullTemplate.strNotes);
      }

      if (fullTemplate.strRefNo) {
        form.setValue("strRefNo", fullTemplate.strRefNo);
      }

      if (
        "bolIsJouranl_Adjustement" in fullTemplate &&
        typeof fullTemplate.bolIsJouranl_Adjustement === "boolean"
      ) {
        form.setValue(
          "bolIsJouranl_Adjustement",
          fullTemplate.bolIsJouranl_Adjustement
        );
      }
    },
    [form]
  );

  const applyTemplateToVoucher = async (templateGuid: string) => {
    try {
      const fullTemplate =
        await journalVoucherTemplateService.getJournalVoucherTemplate(
          templateGuid
        );

      populateVoucherFromTemplate(fullTemplate);

      setShowTemplateSelectionSheet(false);
      toast.success("Template applied successfully");
    } catch {
      toast.error("Failed to load template data");
    }
  };

  useEffect(() => {
    if (isTemplateMode || isEditMode || !templateGuidParam) {
      return;
    }

    const applyTemplate = async () => {
      try {
        const fullTemplate =
          await journalVoucherTemplateService.getJournalVoucherTemplate(
            templateGuidParam
          );
        populateVoucherFromTemplate(fullTemplate);
        toast.success("Template applied successfully");
      } catch {
        toast.error("Failed to load template data");
      } finally {
        const updatedParams = new URLSearchParams(searchParamsString);
        updatedParams.delete("template_guid");
        setSearchParams(updatedParams, { replace: true });
      }
    };

    void applyTemplate();
  }, [
    isTemplateMode,
    isEditMode,
    templateGuidParam,
    searchParamsString,
    setSearchParams,
    populateVoucherFromTemplate,
  ]);

  const onSubmit = async (
    values: JournalVoucherFormValues | JournalVoucherTemplateFormValues,
    status?: string
  ) => {
    if (
      status === "Draft" ||
      status === "Pending For Approval" ||
      status === "Approved"
    ) {
      setSubmittingAs(status);
    }
    if (isTemplateMode) {
      // Template mode logic
      const currentItems = templateItems;
      if (!currentItems || currentItems.length === 0) {
        toast.error("At least one journal voucher template item is required");
        return;
      }

      const templateValues = values as JournalVoucherTemplateFormValues;

      // Validate template has currency type first
      if (!templateValues.strCurrencyTypeGUID) {
        toast.error("Please select a Currency Type for the template");
        return;
      }

      const invalidItems = currentItems
        .map((item, index) => {
          if (!item.strAccountGUID) {
            return { index, error: "Account is required" };
          }
          if (
            (item.dblDebit === null ||
              item.dblDebit === undefined ||
              item.dblDebit === 0) &&
            (item.dblCredit === null ||
              item.dblCredit === undefined ||
              item.dblCredit === 0)
          ) {
            return { index, error: "Either Debit or Credit must have a value" };
          }
          return null;
        })
        .filter((item) => item !== null);

      if (invalidItems.length > 0) {
        invalidItems.forEach((item) => {
          if (item) {
            toast.error(`Item ${item.index + 1}: ${item.error}`);
          }
        });
        return;
      }

      if (isEditMode) {
        // For update, use UpsertDto (with optional GUID)
        const itemsToSubmit: JournalVoucherTemplateItemUpsert[] =
          currentItems.map((item, index) => {
            return {
              strJournal_Voucher_Template_ItemGUID:
                item.strJournal_Voucher_Template_ItemGUID || null,
              intSeqNo: index + 1,
              strAccountGUID: item.strAccountGUID,
              strDesc: item.strDesc || null,
              strRefNo: item.strRefNo || null,
              dblDebit: item.dblDebit ?? null,
              dblCredit: item.dblCredit ?? null,
              dblDebit_BaseCurrency: item.dblDebit_BaseCurrency ?? null,
              dblCredit_BaseCurrency: item.dblCredit_BaseCurrency ?? null,
            };
          });

        const templateExchangeRate = (() => {
          const parsed = customExchangeRate ?? exchangeRateData?.Rate;
          return typeof parsed === "number" &&
            Number.isFinite(parsed) &&
            parsed > 0
            ? parsed
            : 1;
        })();

        const updateData: JournalVoucherTemplateUpdate = {
          strTemplateName: templateValues.strTemplateName,
          strRefNo:
            templateValues.strRefNo && templateValues.strRefNo.trim().length > 0
              ? templateValues.strRefNo.trim()
              : null,
          strNotes: templateValues.strNotes || null,
          strCurrencyTypeGUID: templateValues.strCurrencyTypeGUID,
          bolIsJouranl_Adjustement:
            templateValues.bolIsJouranl_Adjustement ?? false,
          dblExchangeRate: templateExchangeRate,
          items: itemsToSubmit,
        };

        await updateTemplateMutation.mutateAsync(updateData);
        setSubmittingAs(null);
        navigate("/journal-voucher/new");
      } else {
        // For create, use CreateInline DTO (no GUID)
        const itemsToSubmit: JournalVoucherTemplateItemUpsert[] =
          currentItems.map((item, index) => {
            return {
              intSeqNo: index + 1,
              strAccountGUID: item.strAccountGUID,
              strDesc: item.strDesc || null,
              strRefNo: item.strRefNo || null,
              dblDebit: item.dblDebit ?? null,
              dblCredit: item.dblCredit ?? null,
              dblDebit_BaseCurrency: item.dblDebit_BaseCurrency ?? null,
              dblCredit_BaseCurrency: item.dblCredit_BaseCurrency ?? null,
            };
          });

        const templateExchangeRate = (() => {
          const parsed = customExchangeRate ?? exchangeRateData?.Rate;
          return typeof parsed === "number" &&
            Number.isFinite(parsed) &&
            parsed > 0
            ? parsed
            : 1;
        })();

        const createData: JournalVoucherTemplateCreate = {
          strTemplateName: templateValues.strTemplateName,
          strRefNo:
            templateValues.strRefNo && templateValues.strRefNo.trim().length > 0
              ? templateValues.strRefNo.trim()
              : null,
          strNotes: templateValues.strNotes || null,
          strCurrencyTypeGUID: templateValues.strCurrencyTypeGUID,
          bolIsJouranl_Adjustement:
            templateValues.bolIsJouranl_Adjustement ?? false,
          dblExchangeRate: templateExchangeRate,
          items: itemsToSubmit,
        };

        await createTemplateMutation.mutateAsync(createData);
        setSubmittingAs(null);
        // Navigate back to journal voucher list after creating template
        navigate("/journal-voucher/new");
      }
    } else {
      // Journal Voucher mode logic
      if (!voucherItems || voucherItems.length === 0) {
        toast.error("At least one journal voucher item is required");
        return;
      }

      const invalidItems = voucherItems
        .map((item, index) => {
          if (!item.strAccountGUID) {
            return { index, error: "Account is required" };
          }
          if (
            (item.dblDebit === null ||
              item.dblDebit === undefined ||
              item.dblDebit === 0) &&
            (item.dblCredit === null ||
              item.dblCredit === undefined ||
              item.dblCredit === 0)
          ) {
            return { index, error: "Either Debit or Credit must have a value" };
          }
          return null;
        })
        .filter((item) => item !== null);

      if (invalidItems.length > 0) {
        invalidItems.forEach((item) => {
          if (item) {
            toast.error(`Item ${item.index + 1}: ${item.error}`);
          }
        });
        return;
      }

      const voucherValues = values as JournalVoucherFormValues;
      const totalDebit = voucherItems.reduce(
        (sum, item) => sum + (item.dblDebit || 0),
        0
      );
      const totalCredit = voucherItems.reduce(
        (sum, item) => sum + (item.dblCredit || 0),
        0
      );
      const difference = totalDebit - totalCredit;

      if (difference !== 0) {
        toast.error("Journal voucher is not balanced", {
          description: `Debit total (${totalDebit.toFixed(3)}) must equal Credit total (${totalCredit.toFixed(3)}). Difference: ${Math.abs(difference).toFixed(3)}`,
        });
        return;
      }

      // Calculate exchange rate value for base currency conversion
      const exchangeRate = (() => {
        const parsed = customExchangeRate ?? exchangeRateData?.Rate;
        return typeof parsed === "number" &&
          Number.isFinite(parsed) &&
          parsed > 0
          ? parsed
          : 1;
      })();

      const itemsToSubmit = voucherItems.map((item, index) => ({
        strJournal_Voucher_ItemGUID: item.strJournal_Voucher_ItemGUID || null,
        intSeqNo: index + 1,
        strAccountGUID: item.strAccountGUID,
        strDesc: item.strDesc || null,
        strRefNo: item.strRefNo || null,
        dblDebit: item.dblDebit ?? null,
        dblCredit: item.dblCredit ?? null,
        dblDebit_BaseCurrency: item.dblDebit
          ? item.dblDebit * exchangeRate
          : null,
        dblCredit_BaseCurrency: item.dblCredit
          ? item.dblCredit * exchangeRate
          : null,
      }));

      if (isEditMode) {
        const updateData: JournalVoucherUpdate = {
          dJournal_VoucherDate: voucherValues.dJournal_VoucherDate,
          strRefNo: voucherValues.strRefNo || undefined,
          strNotes:
            voucherValues.strNotes && voucherValues.strNotes.trim().length > 0
              ? voucherValues.strNotes.trim()
              : "",
          strCurrencyTypeGUID: voucherValues.strCurrencyTypeGUID,
          dblExchangeRate: exchangeRate,
          dtExchangeRateDate:
            isEditMode && journalVoucher?.dtExchangeRateDate
              ? journalVoucher.dtExchangeRateDate
              : new Date().toISOString().split("T")[0],
          strStatus: status || voucherValues.strStatus,
          bolIsJouranl_Adjustement:
            voucherValues.bolIsJouranl_Adjustement ?? false,
          strReportingMethod: voucherValues.strReportingMethod,
          items: itemsToSubmit,
          strRemoveJournalVoucherItemGUIDs:
            removedJournalVoucherItemGUIDs.length > 0
              ? removedJournalVoucherItemGUIDs
              : undefined,
          recurrence: voucherValues.recurrence || null,
        };

        await updateMutation.mutateAsync({
          journalVoucher: updateData,
          files: attachments.length > 0 ? attachments : undefined,
          removeDocumentIds:
            removedDocumentIds.length > 0 ? removedDocumentIds : undefined,
        });

        setSubmittingAs(null);
        setAttachments([]);
        setRemovedDocumentIds([]);
        setRemovedJournalVoucherItemGUIDs([]);

        navigate("/journal-voucher");
      } else {
        const createData: JournalVoucherCreate = {
          dJournal_VoucherDate: voucherValues.dJournal_VoucherDate,
          strRefNo:
            voucherValues.strRefNo && voucherValues.strRefNo.trim().length > 0
              ? voucherValues.strRefNo.trim()
              : undefined,
          strNotes:
            voucherValues.strNotes && voucherValues.strNotes.trim().length > 0
              ? voucherValues.strNotes.trim()
              : "",
          strCurrencyTypeGUID: voucherValues.strCurrencyTypeGUID,
          dblExchangeRate: exchangeRate,
          dtExchangeRateDate: new Date().toISOString().split("T")[0],
          strStatus: status || "Draft",
          bolIsJouranl_Adjustement: false,
          strReportingMethod: voucherValues.strReportingMethod,
          items: itemsToSubmit,
          recurrence: voucherValues.recurrence || undefined,
        };

        await createMutation.mutateAsync({
          journalVoucher: createData,
          files: attachments.length > 0 ? attachments : undefined,
        });

        setSubmittingAs(null);
        // Clear attachments since they were sent with create request
        setAttachments([]);
        setRemovedDocumentIds([]);

        navigate("/journal-voucher");
      }
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !id) return;

    if (isTemplateMode) {
      await deleteTemplateMutation.mutateAsync(id);
      navigate("/journal-voucher-template");
    } else {
      await deleteMutation.mutateAsync(id);
      navigate("/journal-voucher");
    }
    setShowDeleteConfirm(false);
  };

  const handleBack = () => {
    if (isTemplateMode) {
      navigate("/journal-voucher/new");
    } else {
      navigate("/journal-voucher");
    }
  };

  const isLoading = isTemplateMode ? isFetchingTemplate : isFetchingVoucher;
  const currentError = isTemplateMode ? templateError : voucherError;
  const currentEntity = isTemplateMode
    ? journalVoucherTemplate
    : journalVoucher;

  if (isLoading) {
    return (
      <CustomContainer>
        <JournalVoucherFormSkeleton />
      </CustomContainer>
    );
  }

  if (
    isEditMode &&
    !isLoading &&
    (currentError || (!currentEntity && !isLoading))
  ) {
    return (
      <NotFound
        pageName={
          isTemplateMode ? "Journal Voucher Template" : "Journal Voucher"
        }
      />
    );
  }

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title={
            isTemplateMode
              ? isEditMode
                ? "Edit Journal Voucher Template"
                : "Create Journal Voucher Template"
              : isEditMode
                ? "Edit Journal Voucher"
                : "Create Journal Voucher"
          }
          icon={HeaderIcon}
          description={
            isTemplateMode
              ? isEditMode
                ? `Editing template ${journalVoucherTemplate?.strTemplateName}`
                : "Create a new journal voucher template"
              : isEditMode
                ? `Editing voucher ${journalVoucher?.strJournal_VoucherNo}`
                : "Create a new journal voucher"
          }
          actions={
            <div className="flex gap-2">
              {!isTemplateMode && !isEditMode && (
                <WithPermission
                  module={FormModules.JOURNAL_VOUCHER}
                  action={Actions.SAVE}
                >
                  <Button
                    variant="default"
                    onClick={() => setShowTemplateSelectionSheet(true)}
                    size="sm"
                    className="h-9 text-xs sm:text-sm"
                  >
                    <Book className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                    Apply Template
                  </Button>
                </WithPermission>
              )}
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-9 text-xs sm:text-sm"
                size="sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Back
              </Button>
            </div>
          }
        />

        {isTemplateMode && isFetchingTemplate ? (
          <JournalVoucherFormSkeleton />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => onSubmit(data))}
              className="space-y-6 flex flex-col flex-1"
            >
              <Card>
                <CardContent className="p-4 sm:p-6 pt-4 sm:pt-6">
                  <div className="flex flex-col gap-4 md:gap-6">
                    {!isTemplateMode && showRecurrence && (
                      <div ref={recurrenceRef}>
                        <RecurrenceSettings
                          form={form}
                          onToggleRecurrence={setShowRecurrence}
                        />
                        <Separator className="my-6" />
                      </div>
                    )}

                    {isTemplateMode ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          <FormField
                            control={form.control}
                            name="strTemplateName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Template Name{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter template name"
                                    disabled={isFormDisabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="strRefNo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reference No</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter reference number"
                                    disabled={isFormDisabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="strCurrencyTypeGUID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Currency Type{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    options={
                                      currencyTypes?.map((ct) => ({
                                        value: ct.strCurrencyTypeGUID,
                                        label: ct.strName,
                                      })) || []
                                    }
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                    }}
                                    placeholder="Select currency type"
                                    allowNone={false}
                                    disabled={isFormDisabled}
                                    queryKey={["currencyTypes", "active"]}
                                    isLoading={isLoadingCurrencies}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="strNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="Enter template notes"
                                    rows={3}
                                    disabled={isFormDisabled}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bolIsJouranl_Adjustement"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-end">
                                <FormControl>
                                  <div className="flex items-center gap-3">
                                    <FormLabel className="mb-0 text-base font-medium">
                                      Is Journal Adjustment
                                    </FormLabel>
                                    <Switch
                                      checked={field.value ?? false}
                                      onCheckedChange={field.onChange}
                                      disabled={isFormDisabled}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <FormItem>
                          <FormLabel>Voucher No</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                value={
                                  journalVoucher?.strJournal_VoucherNo ||
                                  "Auto generated"
                                }
                                placeholder="Auto generated"
                                disabled={true}
                                readOnly={true}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={handleSettingsClick}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="Year Settings"
                              >
                                <Settings className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </FormControl>
                        </FormItem>

                        <FormField
                          control={form.control}
                          name="dJournal_VoucherDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Date <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onChange={(date) => {
                                    if (date) {
                                      field.onChange(
                                        format(date, "yyyy-MM-dd")
                                      );
                                    }
                                  }}
                                  restricted={true}
                                  disabled={
                                    isFormDisabled
                                      ? true
                                      : (date) => {
                                          if (
                                            !user?.dtYearStartDate ||
                                            !user?.dtYearEndDate
                                          )
                                            return false;
                                          const startDate = new Date(
                                            user.dtYearStartDate
                                          );
                                          const endDate = new Date(
                                            user.dtYearEndDate
                                          );
                                          return (
                                            date < startDate || date > endDate
                                          );
                                        }
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="strRefNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reference No</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter reference number"
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {!isTemplateMode && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          <FormField
                            control={form.control}
                            name="strCurrencyTypeGUID"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Currency{" "}
                                  <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                  <PreloadedSelect
                                    options={
                                      currencyTypes?.map((currency) => ({
                                        value: currency.strCurrencyTypeGUID,
                                        label: currency.strName,
                                      })) || []
                                    }
                                    selectedValue={field.value || ""}
                                    onChange={(value) => {
                                      field.onChange(
                                        value === "null" ? null : value
                                      );
                                      // Set selected currency for exchange rate check
                                      if (value && value !== "null") {
                                        setSelectedCurrencyGUID(value);
                                      } else {
                                        setSelectedCurrencyGUID("");
                                      }
                                    }}
                                    placeholder="Select Currency"
                                    allowNone={true}
                                    noneLabel="None"
                                    disabled={isFormDisabled}
                                    queryKey={["currencyTypes", "active"]}
                                    isLoading={isLoadingCurrencies}
                                  />
                                </FormControl>
                                <FormMessage />
                                {isDifferentCurrency &&
                                  (exchangeRateData?.Rate ||
                                    (isEditMode &&
                                      journalVoucher?.dblExchangeRate)) && (
                                    <div className="mt-2 space-y-1">
                                      {isEditingExchangeRate &&
                                      !isFormDisabled ? (
                                        <div className="flex flex-col gap-2">
                                          <div className="text-sm text-muted-foreground">
                                            (As on{" "}
                                            {isEditMode &&
                                            journalVoucher?.dtExchangeRateDate
                                              ? new Date(
                                                  journalVoucher.dtExchangeRateDate
                                                )
                                                  .toISOString()
                                                  .split("T")[0]
                                              : new Date()
                                                  .toISOString()
                                                  .split("T")[0]}
                                            )
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm">
                                              1{" "}
                                              {exchangeRateData?.FromCurrency ||
                                                currencyTypes?.find(
                                                  (c) =>
                                                    c.strCurrencyTypeGUID ===
                                                    selectedCurrencyGUID
                                                )?.strName ||
                                                journalVoucher?.strCurrencyTypeName ||
                                                ""}{" "}
                                              =
                                            </span>
                                            <Input
                                              type="text"
                                              inputMode="decimal"
                                              value={
                                                customExchangeRate?.toString() ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                setCustomExchangeRate(
                                                  e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : undefined
                                                )
                                              }
                                              className="h-8 w-32 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              autoFocus
                                            />
                                            <span className="text-sm">
                                              {exchangeRateData?.ToCurrency ||
                                                currencyTypes?.find(
                                                  (c) =>
                                                    c.strCurrencyTypeGUID ===
                                                    user?.strCurrencyTypeGUID
                                                )?.strName ||
                                                ""}
                                            </span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              className="h-8"
                                              onClick={() => {
                                                setIsEditingExchangeRate(false);
                                                toast.success(
                                                  "Exchange rate updated"
                                                );
                                              }}
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant={null}
                                              className="h-8 w-8 p-0"
                                              onClick={() => {
                                                if (
                                                  exchangeRateData?.Rate !==
                                                  undefined
                                                ) {
                                                  setCustomExchangeRate(
                                                    exchangeRateData.Rate
                                                  );
                                                } else if (
                                                  isEditMode &&
                                                  journalVoucher?.dblExchangeRate
                                                ) {
                                                  setCustomExchangeRate(
                                                    journalVoucher.dblExchangeRate
                                                  );
                                                }
                                                setIsEditingExchangeRate(false);
                                              }}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                          <span>
                                            (As on{" "}
                                            {isEditMode &&
                                            journalVoucher?.dtExchangeRateDate
                                              ? new Date(
                                                  journalVoucher.dtExchangeRateDate
                                                )
                                                  .toISOString()
                                                  .split("T")[0]
                                              : new Date()
                                                  .toISOString()
                                                  .split("T")[0]}
                                            ) 1{" "}
                                            {exchangeRateData?.FromCurrency ||
                                              currencyTypes?.find(
                                                (c) =>
                                                  c.strCurrencyTypeGUID ===
                                                  selectedCurrencyGUID
                                              )?.strName ||
                                              journalVoucher?.strCurrencyTypeName ||
                                              ""}{" "}
                                            ={" "}
                                            {(
                                              (isEditMode &&
                                              journalVoucher?.dblExchangeRate
                                                ? journalVoucher.dblExchangeRate
                                                : (customExchangeRate ??
                                                  exchangeRateData?.Rate)) || 0
                                            ).toFixed(3)}{" "}
                                            {exchangeRateData?.ToCurrency ||
                                              currencyTypes?.find(
                                                (c) =>
                                                  c.strCurrencyTypeGUID ===
                                                  user?.strCurrencyTypeGUID
                                              )?.strName ||
                                              ""}
                                          </span>
                                          {!isFormDisabled && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setIsEditingExchangeRate(true)
                                              }
                                              title="Edit Exchange Rate"
                                            >
                                              <Pencil className="h-3 w-3 text-primary" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                {isDifferentCurrency &&
                                  isLoadingExchangeRate && (
                                    <div className="mt-2 text-sm text-muted-foreground">
                                      Loading exchange rate...
                                    </div>
                                  )}
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="strStatus"
                            render={({ field }) => (
                              <input type="hidden" {...field} />
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="strReportingMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Reporting Method</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value || "Accrual and Cash"}
                                  className="flex flex-row space-x-6"
                                  disabled={isFormDisabled}
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Accrual and Cash" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Accrual and Cash
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Accrual" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Accrual Only
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="Cash" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      Cash Only
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="strNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Notes <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter notes"
                                  rows={4}
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bolIsJouranl_Adjustement"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                              <FormLabel>Is Adjusting Journal Entry?</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Separator className="my-6" />
                      </>
                    )}

                    <div>
                      <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                          {isTemplateMode
                            ? "Template Entries"
                            : "Journal Entries"}
                        </h3>
                      </div>

                      <div className="w-full space-y-2">
                        <JournalVoucherItemsTable
                          items={
                            isTemplateMode
                              ? (templateItems as unknown as JournalVoucherItem[])
                              : voucherItems
                          }
                          setItems={
                            isTemplateMode
                              ? (setTemplateItems as unknown as (
                                  items: JournalVoucherItem[]
                                ) => void)
                              : setVoucherItems
                          }
                          disabled={isFormDisabled}
                          onItemDeleted={
                            !isTemplateMode && isEditMode
                              ? (itemGuid: string) => {
                                  setRemovedJournalVoucherItemGUIDs((prev) => [
                                    ...prev,
                                    itemGuid,
                                  ]);
                                }
                              : undefined
                          }
                        />
                      </div>

                      {(() => {
                        const currentItems = isTemplateMode
                          ? templateItems
                          : voucherItems;
                        const totalDebit = currentItems.reduce(
                          (sum, item) => sum + (item.dblDebit || 0),
                          0
                        );
                        const totalCredit = currentItems.reduce(
                          (sum, item) => sum + (item.dblCredit || 0),
                          0
                        );
                        const difference = totalDebit - totalCredit;

                        const formatCurrency = (value: number) => {
                          return new Intl.NumberFormat("en-IN", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          }).format(value);
                        };

                        return (
                          <div className="mt-4">
                            <div className="w-full md:w-3/4 lg:w-1/2 ml-auto">
                              <div className="bg-gray-50 dark:bg-card rounded-lg border border-border-color">
                                <div className="flex justify-between font-bold py-2 sm:py-3 px-3 sm:px-4 border-b border-border-color text-xs sm:text-sm md:text-base">
                                  <div>Total (₹)</div>
                                  <div className="flex gap-3 sm:gap-4 md:gap-8">
                                    <div className="text-right w-16 sm:w-20 md:w-24">
                                      {formatCurrency(totalDebit)}
                                    </div>
                                    <div className="text-right w-16 sm:w-20 md:w-24">
                                      {formatCurrency(totalCredit)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between py-2 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm md:text-base">
                                  <div
                                    className={`font-medium ${
                                      difference !== 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    Difference
                                  </div>
                                  <div className="flex gap-3 sm:gap-4 md:gap-8">
                                    <div
                                      className={`text-right w-16 sm:w-20 md:w-24 font-medium ${
                                        difference !== 0
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {difference < 0
                                        ? formatCurrency(Math.abs(difference))
                                        : ""}
                                    </div>
                                    <div
                                      className={`text-right w-16 sm:w-20 md:w-24 font-medium ${
                                        difference !== 0
                                          ? "text-red-600 dark:text-red-400"
                                          : "text-green-600 dark:text-green-400"
                                      }`}
                                    >
                                      {difference > 0
                                        ? formatCurrency(Math.abs(difference))
                                        : difference === 0
                                          ? formatCurrency(0)
                                          : ""}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {!isTemplateMode && (
                              <div className="mt-6">
                                <AttachmentManager
                                  existingFiles={existingFiles}
                                  onExistingFileRemove={(guid) => {
                                    setRemovedDocumentIds((prev) => [
                                      ...prev,
                                      guid,
                                    ]);
                                    setExistingFiles((prev) =>
                                      prev.filter(
                                        (file) =>
                                          file.strDocumentAssociationGUID !==
                                          guid
                                      )
                                    );
                                  }}
                                  onNewFileAdd={(files) => {
                                    setAttachments((prev) => [
                                      ...prev,
                                      ...files,
                                    ]);
                                  }}
                                  onNewFileRemove={(index) => {
                                    setAttachments((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                  newFiles={attachments}
                                  module="journalVoucher"
                                  readOnly={isFormDisabled}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>

                {/* Footer */}
                <div className="mt-auto bg-card sticky bottom-0 border-t border-border-color">
                  <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      {isEditMode ? (
                        <WithPermission
                          module={
                            isTemplateMode
                              ? FormModules.JOURNAL_VOUCHER
                              : FormModules.JOURNAL_VOUCHER
                          }
                          action={Actions.DELETE}
                        >
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={
                              isFormDisabled ||
                              (isTemplateMode
                                ? deleteTemplateMutation.isPending
                                : deleteMutation.isPending)
                            }
                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isTemplateMode
                              ? deleteTemplateMutation.isPending
                                ? "Deleting..."
                                : "Delete"
                              : deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                          </Button>
                        </WithPermission>
                      ) : null}

                      {!isTemplateMode && (
                        <Button
                          type="button"
                          variant={showRecurrence ? "default" : "outline"}
                          onClick={() => {
                            handleMakeRecurring();
                            if (!showRecurrence) {
                              setTimeout(() => {
                                recurrenceRef.current?.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }, 100);
                            }
                          }}
                          disabled={isFormDisabled}
                          className="gap-2 w-full sm:w-auto"
                        >
                          <Repeat className="h-4 w-4" />
                          {showRecurrence ? "Hide" : "Make"} Recurring
                        </Button>
                      )}
                    </div>

                    <WithPermission
                      module={FormModules.JOURNAL_VOUCHER}
                      action={isEditMode ? Actions.EDIT : Actions.SAVE}
                    >
                      {!isTemplateMode && !isEditMode ? (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            onClick={form.handleSubmit((data) =>
                              onSubmit(data, "Draft")
                            )}
                            disabled={createMutation.isPending}
                            variant="outline"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {createMutation.isPending &&
                            submittingAs === "Draft"
                              ? "Saving..."
                              : "Save as Draft"}
                          </Button>
                          <Button
                            type="button"
                            onClick={form.handleSubmit((data) =>
                              onSubmit(
                                data,
                                hasApproveRights
                                  ? "Approved"
                                  : "Pending For Approval"
                              )
                            )}
                            disabled={createMutation.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {createMutation.isPending &&
                            (submittingAs === "Pending For Approval" ||
                              submittingAs === "Approved")
                              ? "Saving..."
                              : hasApproveRights
                                ? "Save and Approve"
                                : "Save and Submit for Approval"}
                          </Button>
                        </div>
                      ) : !isTemplateMode && isEditMode ? (
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            type="button"
                            onClick={form.handleSubmit((data) =>
                              onSubmit(data, "Draft")
                            )}
                            disabled={
                              isFormDisabled || updateMutation.isPending
                            }
                            variant="outline"
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updateMutation.isPending &&
                            submittingAs === "Draft"
                              ? "Saving..."
                              : "Save as Draft"}
                          </Button>
                          <Button
                            type="button"
                            onClick={form.handleSubmit((data) =>
                              onSubmit(
                                data,
                                hasApproveRights
                                  ? "Approved"
                                  : "Pending For Approval"
                              )
                            )}
                            disabled={
                              isFormDisabled || updateMutation.isPending
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {updateMutation.isPending &&
                            (submittingAs === "Pending For Approval" ||
                              submittingAs === "Approved")
                              ? "Saving..."
                              : hasApproveRights
                                ? "Save and Approve"
                                : "Save and Submit for Approval"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="submit"
                          disabled={
                            isFormDisabled ||
                            (isTemplateMode
                              ? isEditMode
                                ? updateTemplateMutation.isPending
                                : createTemplateMutation.isPending
                              : isEditMode
                                ? updateMutation.isPending
                                : createMutation.isPending)
                          }
                          className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isTemplateMode
                            ? isEditMode
                              ? updateTemplateMutation.isPending
                                ? "Updating..."
                                : "Update"
                              : createTemplateMutation.isPending
                                ? "Creating..."
                                : "Create"
                            : isEditMode
                              ? updateMutation.isPending
                                ? "Updating..."
                                : "Update"
                              : createMutation.isPending
                                ? "Creating..."
                                : "Create"}
                        </Button>
                      )}
                    </WithPermission>
                  </CardFooter>
                </div>
              </Card>
            </form>
          </Form>
        )}

        <ConfirmationDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDelete}
          title={`Confirm Deletion`}
          description={`Are you sure you want to delete this ${isTemplateMode ? "journal voucher template" : "journal voucher"}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          isLoading={
            isTemplateMode
              ? deleteTemplateMutation.isPending
              : deleteMutation.isPending
          }
        />

        {/* Template Selection Drawer */}
        <TemplateSelectionDrawer
          open={showTemplateSelectionSheet}
          onOpenChange={setShowTemplateSelectionSheet}
          onTemplateSelect={applyTemplateToVoucher}
        />
      </CustomContainer>
    </>
  );
};

export default JournalVoucherForm;
