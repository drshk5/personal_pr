// India GST Settings
export interface GSTSettings {
  GSTNumber: string;
  EInvoiceEnabled: boolean;
  CompositionScheme: boolean;
  GSTINVerificationRequired: boolean;
  PrintHSNCode: boolean;
}

// UK VAT Settings
export interface VATSettings {
  VATNumber: string;
  VATScheme: "Standard" | "FlatRate" | "CashAccounting";
  MTDEnabled: boolean;
  AccountingBasis: "Accrual" | "Cash";
  FlatRatePercentage: number | null;
}

// USA Sales Tax Settings
export interface SalesTaxSettings {
  PrimaryState: string;
  TaxLicenseNumber: string;
  NexusStates: string[];
  EconomicNexusEnabled: boolean;
  MarketplaceFacilitator: boolean;
  ShowTaxBreakdownOnInvoice: boolean;
}

// Union type for all tax settings
export type TaxSettings = GSTSettings | VATSettings | SalesTaxSettings;

// Helper to create default settings based on country
export const createDefaultGSTSettings = (): GSTSettings => ({
  GSTNumber: "",
  EInvoiceEnabled: false,
  CompositionScheme: false,
  GSTINVerificationRequired: true,
  PrintHSNCode: true,
});

export const createDefaultVATSettings = (): VATSettings => ({
  VATNumber: "",
  VATScheme: "Standard",
  MTDEnabled: true,
  AccountingBasis: "Accrual",
  FlatRatePercentage: null,
});

export const createDefaultSalesTaxSettings = (): SalesTaxSettings => ({
  PrimaryState: "",
  TaxLicenseNumber: "",
  NexusStates: [],
  EconomicNexusEnabled: true,
  MarketplaceFacilitator: false,
  ShowTaxBreakdownOnInvoice: true,
});
