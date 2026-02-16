import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarSync, Save, Pencil, X } from "lucide-react";

import { useCreateJournalVoucher, useExchangeRate } from "@/hooks";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { useMenuIcon } from "@/hooks/common/use-menu-icon";
import { useAuthContext } from "@/hooks/common/use-auth-context";

import { Actions, FormModules } from "@/lib/permissions";

import type {
  JournalVoucherItem,
  JournalVoucherCreate,
} from "@/types/Account/journal-voucher";
import {
  journalVoucherRecurringProfileSchema,
  type JournalVoucherRecurringProfileFormValues,
} from "@/validations/Account/journal-voucher-recurring";

import CustomContainer from "@/components/layout/custom-container";
import { PageHeader } from "@/components/layout/page-header";
import { WithPermission } from "@/components/ui/with-permission";
import { PreloadedSelect } from "@/components/ui/select/preloaded-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { JournalVoucherItemsTable } from "@/pages/Account/journalvoucher/components/JournalVoucherItemsTable";
import { Separator } from "@/components/ui/separator";

const RecurringProfileForm: React.FC = () => {
  const navigate = useNavigate();
  const createVoucher = useCreateJournalVoucher();

  const HeaderIcon = useMenuIcon(
    FormModules.JOURNAL_VOUCHER_RECURRING,
    CalendarSync
  );

  const [selectedRepeatType, setSelectedRepeatType] =
    React.useState<string>("Daily");
  const [neverExpires, setNeverExpires] = React.useState<boolean>(false);
  const [voucherItems, setVoucherItems] = React.useState<JournalVoucherItem[]>(
    []
  );

  const [voucherDate, setVoucherDate] = React.useState<string>("");
  const [refNo, setRefNo] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");
  const [reportingMethod, setReportingMethod] =
    React.useState<string>("Accrual and Cash");
  const [isAdjusting, setIsAdjusting] = React.useState<boolean>(false);
  const [currencyGUID, setCurrencyGUID] = React.useState<string>("");
  const [exchangeRate, setExchangeRate] = React.useState<number>(1);
  const [isEditingRate, setIsEditingRate] = React.useState<boolean>(false);

  const { user } = useAuthContext();
  const { data: currencyTypes, isLoading: isLoadingCurrencies } =
    useActiveCurrencyTypes(undefined, true);

  const shouldFetchExchangeRate = !!currencyGUID;
  const { data: exchangeRateData, isLoading: isLoadingExchangeRate } =
    useExchangeRate(
      { strFromCurrencyGUID: currencyGUID },
      {
        enabled: shouldFetchExchangeRate,
      }
    );

  const form = useForm<JournalVoucherRecurringProfileFormValues>({
    resolver: zodResolver(
      journalVoucherRecurringProfileSchema
    ) as unknown as Resolver<JournalVoucherRecurringProfileFormValues>,
    defaultValues: {
      strProfileName: "",
      strRepeatType: "Daily",
      intRepeatEveryValue: 1,
      strRepeatEveryUnit: null,
      intRepeatOnDay: null,
      strRepeatOnWeekday: null,
      strCustomFrequencyJson: null,
      dStartDate: "",
      dEndDate: null,
      bolNeverExpires: false,
      strStatus: "Draft",
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "strRepeatType" && value.strRepeatType) {
        const type = value.strRepeatType;
        setSelectedRepeatType(type);

        if (type !== "Custom") {
          form.setValue("intRepeatEveryValue", 1);
          if (type === "Daily") form.setValue("strRepeatEveryUnit", "Day");
          else if (type === "Weekly")
            form.setValue("strRepeatEveryUnit", "Week");
          else if (type === "Monthly")
            form.setValue("strRepeatEveryUnit", "Month");
          else if (type === "Yearly")
            form.setValue("strRepeatEveryUnit", "Year");
        }
      }
      if (name === "bolNeverExpires") {
        setNeverExpires(value.bolNeverExpires || false);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  React.useEffect(() => {
    if (!currencyGUID && user?.strCurrencyTypeGUID) {
      setCurrencyGUID(user.strCurrencyTypeGUID);
    }
  }, [currencyGUID, user?.strCurrencyTypeGUID]);

  React.useEffect(() => {
    if (!currencyGUID) return;
    if (exchangeRateData?.Rate && !isEditingRate) {
      setExchangeRate(Number(exchangeRateData.Rate.toFixed(3)));
    }
  }, [currencyGUID, exchangeRateData, isEditingRate]);

  const repeatTypeOptions = [
    { value: "Daily", label: "Daily" },
    { value: "Weekly", label: "Weekly" },
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
    { value: "Custom", label: "Custom" },
  ];

  const repeatUnitOptions = {
    Daily: [{ value: "Day", label: "Day(s)" }],
    Weekly: [{ value: "Week", label: "Week(s)" }],
    Monthly: [{ value: "Month", label: "Month(s)" }],
    Yearly: [{ value: "Year", label: "Year(s)" }],
    Custom: [
      { value: "Day", label: "Day(s)" },
      { value: "Week", label: "Week(s)" },
      { value: "Month", label: "Month(s)" },
      { value: "Year", label: "Year(s)" },
    ],
  } as const;

  const weekdayOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  const onSubmit = async (data: JournalVoucherRecurringProfileFormValues) => {
    if (!currencyGUID) {
      alert("Please select a currency");
      return;
    }
    if (!voucherDate) {
      alert("Please select voucher date");
      return;
    }
    if (!voucherItems || voucherItems.length === 0) {
      alert("At least one journal voucher item is required");
      return;
    }

    const totalDebit = voucherItems.reduce(
      (sum, item) => sum + (item.dblDebit || 0),
      0
    );
    const totalCredit = voucherItems.reduce(
      (sum, item) => sum + (item.dblCredit || 0),
      0
    );
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      alert("Journal voucher is not balanced");
      return;
    }

    const rate =
      typeof exchangeRate === "number" && exchangeRate > 0 ? exchangeRate : 1;

    const itemsToSubmit = voucherItems.map((item, index) => ({
      strJournal_Voucher_ItemGUID: item.strJournal_Voucher_ItemGUID || null,
      intSeqNo: index + 1,
      strAccountGUID: item.strAccountGUID,
      strDesc: item.strDesc || null,
      strRefNo: item.strRefNo || null,
      dblDebit: item.dblDebit ?? null,
      dblCredit: item.dblCredit ?? null,
      dblDebit_BaseCurrency: item.dblDebit ? item.dblDebit * rate : null,
      dblCredit_BaseCurrency: item.dblCredit ? item.dblCredit * rate : null,
    }));

    const createData: JournalVoucherCreate = {
      dJournal_VoucherDate: voucherDate,
      strRefNo: refNo || undefined,
      strNotes: notes || "",
      strCurrencyTypeGUID: currencyGUID,
      dblExchangeRate: rate,
      dtExchangeRateDate: new Date().toISOString().split("T")[0],
      strStatus: data.strStatus || "Draft",
      bolIsJouranl_Adjustement: isAdjusting,
      strReportingMethod: reportingMethod,
      items: itemsToSubmit,
      recurrence: {
        strProfileName: data.strProfileName,
        strRepeatType: data.strRepeatType,
        intRepeatEveryValue: data.intRepeatEveryValue,
        strRepeatEveryUnit: data.strRepeatEveryUnit,
        intRepeatOnDay: data.intRepeatOnDay,
        strRepeatOnWeekday: data.strRepeatOnWeekday,
        strCustomFrequencyJson: data.strCustomFrequencyJson,
        dStartDate: data.dStartDate,
        dEndDate: data.bolNeverExpires ? null : data.dEndDate,
        bolNeverExpires: data.bolNeverExpires,
      },
    };

    await createVoucher.mutateAsync({ journalVoucher: createData });
    navigate("/journal-voucher-recurring");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(value);

  return (
    <>
      <CustomContainer className="flex flex-col h-screen">
        <PageHeader
          title="Create Recurring Journal Voucher"
          description="Create a journal voucher with recurrence settings"
          icon={HeaderIcon}
          actions={
            <Button
              variant="outline"
              onClick={() => navigate("/journal-voucher-recurring")}
              className="h-9 text-xs sm:text-sm"
              size="sm"
              disabled={createVoucher.isPending}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              Back
            </Button>
          }
        />

        <Form {...form}>
          <form className="space-y-6 flex flex-col flex-1">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="strProfileName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Profile Name{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter profile name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="strRepeatType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Repeat Type{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select repeat type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {repeatTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dStartDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              Recurrence Start Date{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date?: Date) => {
                                  field.onChange(
                                    date ? date.toISOString() : ""
                                  );
                                }}
                                placeholder="Select start date"
                                restricted={true}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {["Custom", "Monthly", "Weekly"].includes(
                      selectedRepeatType
                    ) && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {selectedRepeatType !== "" && (
                          <>
                            <FormField
                              control={form.control}
                              name="intRepeatEveryValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Repeat Every Value{" "}
                                    <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      placeholder="Enter value"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseInt(e.target.value, 10) || 1
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="strRepeatEveryUnit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Repeat Unit</FormLabel>
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {(
                                        repeatUnitOptions[
                                          selectedRepeatType as keyof typeof repeatUnitOptions
                                        ] || []
                                      ).map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {selectedRepeatType === "Monthly" && (
                          <FormField
                            control={form.control}
                            name="intRepeatOnDay"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Repeat on Day (1-31)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    placeholder="Enter day of month"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        ? parseInt(e.target.value, 10)
                                        : null;
                                      field.onChange(val);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedRepeatType === "Weekly" && (
                          <FormField
                            control={form.control}
                            name="strRepeatOnWeekday"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Repeat on Weekday</FormLabel>
                                <Select
                                  value={field.value || ""}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select weekday" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {weekdayOptions.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="dEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Recurrence End Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date?: Date) => {
                                  field.onChange(
                                    date ? date.toISOString() : null
                                  );
                                }}
                                placeholder="Select end date"
                                disabled={neverExpires}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bolNeverExpires"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-start gap-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">
                                Never Expires
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  setNeverExpires(checked);
                                  if (checked) form.setValue("dEndDate", null);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div />
                    </div>

                    <Separator className="my-6" />
                    <h3 className="text-lg font-semibold mb-4">
                      Journal Voucher Details
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <div>
                        <FormLabel>Voucher Date</FormLabel>
                        <DatePicker
                          value={
                            voucherDate ? new Date(voucherDate) : undefined
                          }
                          onChange={(date?: Date) => {
                            setVoucherDate(
                              date ? date.toISOString().split("T")[0] : ""
                            );
                          }}
                          placeholder="Select date"
                          restricted={true}
                        />
                      </div>
                      <div>
                        <FormLabel>Reference No</FormLabel>
                        <Input
                          value={refNo}
                          onChange={(e) => setRefNo(e.target.value)}
                          placeholder="Enter reference number"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <FormLabel>Currency</FormLabel>
                        <PreloadedSelect
                          options={
                            currencyTypes?.map((currency) => ({
                              value: currency.strCurrencyTypeGUID,
                              label: currency.strName,
                            })) || []
                          }
                          selectedValue={currencyGUID}
                          onChange={(value) => {
                            setCurrencyGUID(value || "");
                            setIsEditingRate(false);
                            if (!value) setExchangeRate(1);
                          }}
                          placeholder="Select Currency"
                          queryKey={["currencyTypes", "active"]}
                          isLoading={isLoadingCurrencies}
                        />
                        {currencyGUID &&
                          currencyGUID !== user?.strCurrencyTypeGUID && (
                            <div className="mt-2 space-y-1">
                              {isEditingRate ? (
                                <div className="flex flex-col gap-2">
                                  <div className="text-sm text-muted-foreground">
                                    (As on{" "}
                                    {new Date().toISOString().split("T")[0]})
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">
                                      1{" "}
                                      {exchangeRateData?.FromCurrency ||
                                        currencyTypes?.find(
                                          (c) =>
                                            c.strCurrencyTypeGUID ===
                                            currencyGUID
                                        )?.strName ||
                                        ""}{" "}
                                      =
                                    </span>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={exchangeRate.toString()}
                                      onChange={(e) => {
                                        setIsEditingRate(true);
                                        setExchangeRate(
                                          e.target.value
                                            ? parseFloat(e.target.value) || 1
                                            : 1
                                        );
                                      }}
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
                                      onClick={() => setIsEditingRate(false)}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={() => {
                                        if (
                                          exchangeRateData?.Rate !== undefined
                                        ) {
                                          setExchangeRate(
                                            exchangeRateData.Rate
                                          );
                                        }
                                        setIsEditingRate(false);
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
                                    {new Date().toISOString().split("T")[0]}) 1{" "}
                                    {exchangeRateData?.FromCurrency ||
                                      currencyTypes?.find(
                                        (c) =>
                                          c.strCurrencyTypeGUID === currencyGUID
                                      )?.strName ||
                                      ""}{" "}
                                    = {exchangeRate.toFixed(3)}{" "}
                                    {exchangeRateData?.ToCurrency ||
                                      currencyTypes?.find(
                                        (c) =>
                                          c.strCurrencyTypeGUID ===
                                          user?.strCurrencyTypeGUID
                                      )?.strName ||
                                      ""}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingRate(true)}
                                    title="Edit Exchange Rate"
                                  >
                                    <Pencil className="h-3 w-3 text-primary" />
                                  </button>
                                </div>
                              )}
                              {isLoadingExchangeRate && (
                                <div className="text-xs text-muted-foreground">
                                  Loading exchange rate...
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      <div>
                        <FormLabel>Reporting Method</FormLabel>
                        <RadioGroup
                          value={reportingMethod}
                          onValueChange={(val) => setReportingMethod(val)}
                          className="flex flex-row space-x-2 mt-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Accrual and Cash" />
                            <FormLabel className="font-normal">
                              Accrual and Cash
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Accrual" />
                            <FormLabel className="font-normal">
                              Accrual Only
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Cash" />
                            <FormLabel className="font-normal">
                              Cash Only
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex flex-col">
                        <FormLabel>Is Adjusting Journal Entry?</FormLabel>
                        <div className="flex items-center mt-2">
                          <Switch
                            checked={isAdjusting}
                            onCheckedChange={setIsAdjusting}
                          />
                        </div>
                      </div>
                      <div />
                    </div>

                    <div className="mb-6">
                      <FormLabel>Notes</FormLabel>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Enter notes"
                        className="mt-2"
                      />
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-medium">Journal Entries</h3>
                      </div>

                      <div className="w-full space-y-2">
                        <JournalVoucherItemsTable
                          items={voucherItems}
                          setItems={setVoucherItems}
                        />
                      </div>

                      {(() => {
                        const totalDebit = voucherItems.reduce(
                          (sum, item) => sum + (item.dblDebit || 0),
                          0
                        );
                        const totalCredit = voucherItems.reduce(
                          (sum, item) => sum + (item.dblCredit || 0),
                          0
                        );
                        const difference = totalDebit - totalCredit;

                        return (
                          <div className="mt-4">
                            <div className="w-full lg:w-1/2 ml-auto">
                              <div className="bg-gray-50 dark:bg-card rounded-lg border border-border-color">
                                <div className="flex justify-between font-bold py-2 sm:py-3 px-3 sm:px-4 border-b border-border-color text-sm sm:text-base">
                                  <div>Total (₹)</div>
                                  <div className="flex gap-4 sm:gap-8">
                                    <div className="text-right w-20 sm:w-24">
                                      {formatCurrency(totalDebit)}
                                    </div>
                                    <div className="text-right w-20 sm:w-24">
                                      {formatCurrency(totalCredit)}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between py-2 sm:py-3 px-3 sm:px-4 text-sm sm:text-base">
                                  <div
                                    className={`font-medium ${
                                      difference !== 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {difference === 0
                                      ? "Balanced"
                                      : "Difference"}
                                  </div>
                                  <div
                                    className={`font-bold ${
                                      difference !== 0
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-green-600 dark:text-green-400"
                                    }`}
                                  >
                                    {formatCurrency(Math.abs(difference))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>

                <div className="mt-auto bg-card sticky bottom-0 border-t border-border-color">
                  <CardFooter className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
                    <div />
                    <WithPermission
                      module={FormModules.JOURNAL_VOUCHER_RECURRING}
                      action={Actions.SAVE}
                    >
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={form.handleSubmit(onSubmit)}
                          disabled={createVoucher.isPending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {createVoucher.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </WithPermission>
                  </CardFooter>
                </div>
              </Card>
            </div>
          </form>
        </Form>
      </CustomContainer>
    </>
  );
};

export default RecurringProfileForm;
