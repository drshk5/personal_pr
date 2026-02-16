import type { InvoiceAddress } from "@/types/Account/salesinvoice";

export const formatInvoiceAddress = (address?: InvoiceAddress | null) => {
  if (!address) return "";

  const parts: string[] = [];
  if (address.strAttention) parts.push(address.strAttention);
  if (address.strAddress) parts.push(address.strAddress);

  const cityStatePin = [
    address.strCityName,
    address.strStateName,
    address.strPinCode,
  ].filter(Boolean);
  if (cityStatePin.length > 0) parts.push(cityStatePin.join(", "));

  if (address.strCountryName) parts.push(address.strCountryName);
  if (address.strPhone) parts.push(`Phone: ${address.strPhone}`);

  return parts.join("\n");
};
