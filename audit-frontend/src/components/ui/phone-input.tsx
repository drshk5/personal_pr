import React, { useState, useRef, useEffect, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./select/select";
import { useActiveCountries } from "@/hooks/api/central/use-countries";
import { useAuthContext } from "@/hooks/common/use-auth-context";
import type { CountrySimple } from "@/types/central/country";

// Flag component using country code
const FlagIcon = ({ countryCode }: { countryCode: string }) => {
  return (
    <img
      src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png 2x`}
      width="20"
      alt={countryCode}
      className="inline-block"
    />
  );
};

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultCountry?: string;
  className?: string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter phone number",
  defaultCountry,
  className,
  onValidationChange,
}: PhoneInputProps) {
  const { user } = useAuthContext();
  const { data: allCountries = [], isLoading } = useActiveCountries();

  // Filter countries to only include those with dial codes
  const countries = allCountries.filter(
    (country) => country.strDialCode && country.strCountryCode
  );

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountrySimple | null>(
    null
  );
  const [validationError, setValidationError] = useState<string>("");
  const isUpdatingFromValue = useRef(false);

  // Set default country from user context or prop
  useEffect(() => {
    if (countries.length > 0 && !selectedCountry) {
      const userCountryGuid = user?.strCountryGUID;
      const userCountry = userCountryGuid
        ? countries.find((c) => c.strCountryGUID === userCountryGuid)
        : null;
      const defaultCountryToUse = userCountry?.strCountryCode || defaultCountry;
      const country =
        countries.find((c) => c.strCountryCode === defaultCountryToUse) ||
        countries[0];
      setSelectedCountry(country);
    }
  }, [countries, selectedCountry, user?.strCountryGUID, defaultCountry]);

  // Validate phone number based on country rules
  const validatePhoneNumber = useCallback(
    (
      number: string,
      country: CountrySimple
    ): { isValid: boolean; error?: string } => {
      if (!number) {
        return { isValid: true };
      }

      const length = number.length;
      const minLength = country.intPhoneMinLength || 0;
      const maxLength = country.intPhoneMaxLength || 15;

      if (length < minLength) {
        return {
          isValid: false,
          error: `Phone number must be at least ${minLength} digits for ${country.strName}`,
        };
      }

      if (length > maxLength) {
        return {
          isValid: false,
          error: `Phone number must not exceed ${maxLength} digits for ${country.strName}`,
        };
      }

      return { isValid: true };
    },
    []
  );

  useEffect(() => {
    if (!selectedCountry) return;

    if (value) {
      // Only auto-detect country from dial code if selected country doesn't match the value's dial code
      // This prevents switching away from user's configured country
      let targetCountry = selectedCountry;

      const valueStartsWithDialCode = value.startsWith(
        selectedCountry.strDialCode || ""
      );

      if (!valueStartsWithDialCode) {
        const matchedCountry = countries.find(
          (country) =>
            country.strDialCode && value.startsWith(country.strDialCode)
        );

        if (matchedCountry && matchedCountry.strDialCode) {
          targetCountry = matchedCountry;
          setSelectedCountry(matchedCountry);
        }
      }

      isUpdatingFromValue.current = true;
      const cleanValue = value
        .replace(targetCountry.strDialCode || "", "")
        .trim();

      // Format with space after every 5 digits for display
      const formattedPhone = cleanValue
        .replace(/\D/g, "")
        .replace(/(\d{5})(?=\d)/g, "$1 ");

      setPhoneNumber(formattedPhone);
      isUpdatingFromValue.current = false;
    } else if (value === "") {
      isUpdatingFromValue.current = true;
      setPhoneNumber("");
      isUpdatingFromValue.current = false;
    }
  }, [value, selectedCountry, countries]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find((c) => c.strCountryCode === countryCode);
    if (country) {
      setSelectedCountry(country);
      const cleanPhoneNumber = phoneNumber.replace(/\s/g, "");
      const fullNumber = cleanPhoneNumber
        ? `${country.strDialCode} ${cleanPhoneNumber}`
        : "";
      onChange(fullNumber);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCountry) return;

    const inputValue = e.target.value;
    // Only allow digits
    const numericValue = inputValue.replace(/\D/g, "");

    // Enforce max length based on country
    const maxLength = selectedCountry.intPhoneMaxLength || 15;
    const limitedValue = numericValue.slice(0, maxLength);

    // Format with space after every 5 digits for display
    const formattedValue = limitedValue.replace(/(\d{5})(?=\d)/g, "$1 ");

    setPhoneNumber(formattedValue);

    // Call onChange directly to avoid infinite loop
    const cleanPhoneNumber = formattedValue.replace(/\s/g, "");
    const fullNumber = cleanPhoneNumber
      ? `${selectedCountry.strDialCode} ${cleanPhoneNumber}`
      : "";
    onChange(fullNumber);
  };

  const handlePhoneBlur = () => {
    if (!selectedCountry) return;

    // Validate on blur
    const cleanPhoneNumber = phoneNumber.replace(/\s/g, "");
    const validation = validatePhoneNumber(cleanPhoneNumber, selectedCountry);
    setValidationError(validation.error || "");

    if (onValidationChange) {
      onValidationChange(validation.isValid, validation.error);
    }
  };

  if (isLoading || !selectedCountry || countries.length === 0) {
    return (
      <div className="relative w-full h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <div className="relative w-full">
      <div className="relative flex items-stretch gap-0">
        {/* Country Selector */}
        <Select
          value={selectedCountry.strCountryCode || ""}
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "w-23.75 rounded-r-none border-r-0 phone-input-preserve-border justify-start gap-1.5",
              disabled && "cursor-not-allowed"
            )}
          >
            <FlagIcon countryCode={selectedCountry.strCountryCode || ""} />
            <span className="text-sm font-medium">
              {selectedCountry.strDialCode}
            </span>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem
                key={country.strCountryGUID}
                value={country.strCountryCode || ""}
              >
                <div className="flex items-center gap-2 w-full">
                  <FlagIcon countryCode={country.strCountryCode || ""} />
                  <span>{country.strName}</span>
                  <span className="text-xs ml-auto">{country.strDialCode}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phone Number Input */}
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          onBlur={handlePhoneBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("rounded-l-none flex-1", className)}
        />
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <p className="text-sm text-red-400 mt-1 ml-1">{validationError}</p>
      )}
    </div>
  );
}
