import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select/select";
import { useActiveCountries, useFetchCurrencyByCountry } from "@/hooks/api/central/use-countries";
import { useActiveCurrencyTypes } from "@/hooks/api/central/use-currency-types";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select country",
  className,
}: CountrySelectProps) {
  const { data: countries = [] } = useActiveCountries();

  const selectedCountry = useMemo(
    () => countries.find((country) => country.strName === (value || "")),
    [countries, value]
  );

  const { data: countryCurrency } = useFetchCurrencyByCountry(
    selectedCountry?.strCountryGUID
  );
  const { data: currencies = [] } = useActiveCurrencyTypes(undefined, !!countryCurrency?.strCurrencyTypeGUID);

  const currencyName = useMemo(() => {
    if (!countryCurrency?.strCurrencyTypeGUID) return null;
    return (
      currencies.find((currency) => currency.strCurrencyTypeGUID === countryCurrency.strCurrencyTypeGUID)
        ?.strName || null
    );
  }, [countryCurrency?.strCurrencyTypeGUID, currencies]);

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.strName.localeCompare(b.strName)),
    [countries]
  );

  return (
    <div className="space-y-2">
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {sortedCountries.map((country) => (
            <SelectItem key={country.strCountryGUID} value={country.strName}>
              <div className="flex w-full items-center gap-2">
                <span>{country.strName}</span>
                {country.strCountryCode && (
                  <span className="text-xs text-muted-foreground">{country.strCountryCode}</span>
                )}
                {country.strDialCode && (
                  <span className="ml-auto text-xs text-muted-foreground">{country.strDialCode}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCountry && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedCountry.strCountryCode && (
            <Badge variant="secondary" className="text-[10px]">
              {selectedCountry.strCountryCode}
            </Badge>
          )}
          {selectedCountry.strDialCode && (
            <Badge variant="outline" className="text-[10px]">
              {selectedCountry.strDialCode}
            </Badge>
          )}
          {currencyName && (
            <Badge variant="outline" className="text-[10px]">
              {currencyName}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
