import { useEffect, useMemo, useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import {
  getAllCitiesOfCountry,
  getCountries,
  type ICountry,
} from '@countrystatecity/countries-browser';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import clsx from 'clsx';
import Input from '@/components/ui/Input';

type CountryOption = ICountry & { displayName: string };

export interface CountryCitySelectorProps {
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  countryLabel?: string;
  cityLabel?: string;
  countryError?: string;
  cityError?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const citiesCache = new Map<string, string[]>();

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function filterOptions(options: string[], query: string, limit = 150) {
  const normalizedQuery = normalize(query);
  const filtered = normalizedQuery
    ? options.filter((option) => normalize(option).includes(normalizedQuery))
    : options;
  return filtered.slice(0, limit);
}

function fieldClass(error?: string) {
  return clsx(
    'w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors placeholder:text-gray-400',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
    error
      ? 'border-error-200 focus:border-error-400 focus:ring-error-400'
      : 'border-gray-300',
  );
}

export default function CountryCitySelector({
  country,
  city,
  onCountryChange,
  onCityChange,
  countryLabel = 'Pays',
  cityLabel = 'Ville',
  countryError,
  cityError,
  required = false,
  disabled = false,
  className,
}: CountryCitySelectorProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [countryQuery, setCountryQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [countriesError, setCountriesError] = useState(false);
  const [citiesError, setCitiesError] = useState(false);

  useEffect(() => {
    let active = true;
    const displayNames = new Intl.DisplayNames(['fr'], { type: 'region' });

    getCountries()
      .then((items) => {
        if (!active) return;
        const localized = items
          .map((item) => ({
            ...item,
            displayName: displayNames.of(item.iso2) || item.name,
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));
        setCountries(localized);
        setCountriesError(false);
      })
      .catch(() => {
        if (active) setCountriesError(true);
      })
      .finally(() => {
        if (active) setLoadingCountries(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCountry = useMemo(() => {
    const normalizedCountry = normalize(country);
    if (!normalizedCountry) return undefined;
    return countries.find(
      (item) =>
        normalize(item.displayName) === normalizedCountry ||
        normalize(item.name) === normalizedCountry ||
        normalize(item.native) === normalizedCountry ||
        normalize(item.iso2) === normalizedCountry,
    );
  }, [countries, country]);

  useEffect(() => {
    const countryCode = selectedCountry?.iso2;
    if (!countryCode) {
      setCities([]);
      setCitiesError(false);
      return;
    }

    const cached = citiesCache.get(countryCode);
    if (cached) {
      setCities(cached);
      setCitiesError(false);
      return;
    }

    let active = true;
    setLoadingCities(true);
    setCitiesError(false);
    getAllCitiesOfCountry(countryCode)
      .then((items) => {
        if (!active) return;
        const names = Array.from(new Set(items.map((item) => item.name).filter(Boolean)))
          .sort((a, b) => a.localeCompare(b, 'fr'));
        citiesCache.set(countryCode, names);
        setCities(names);
      })
      .catch(() => {
        if (active) {
          setCities([]);
          setCitiesError(true);
        }
      })
      .finally(() => {
        if (active) setLoadingCities(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCountry?.iso2]);

  const countryNames = useMemo(
    () => filterOptions(countries.map((item) => item.displayName), countryQuery),
    [countries, countryQuery],
  );
  const cityNames = useMemo(
    () => filterOptions(cities, cityQuery),
    [cities, cityQuery],
  );

  const handleCountryChange = (displayName: string | null) => {
    const nextCountry = displayName ?? '';
    if (normalize(nextCountry) !== normalize(country)) onCityChange('');
    onCountryChange(nextCountry);
    setCountryQuery('');
  };

  const cityUnavailable = countriesError || citiesError || (!!selectedCountry && !loadingCities && cities.length === 0);

  return (
    <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
      {countriesError ? (
        <Input
          label={`${countryLabel}${required ? ' *' : ''}`}
          value={country}
          onChange={(event) => {
            if (normalize(event.target.value) !== normalize(country)) onCityChange('');
            onCountryChange(event.target.value);
          }}
          error={countryError}
          disabled={disabled}
          placeholder="Saisir le pays"
        />
      ) : (
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {countryLabel}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <Combobox
            value={country || null}
            onChange={handleCountryChange}
            disabled={disabled || loadingCountries}
          >
            <div className="relative">
              <ComboboxInput
                displayValue={(value: string | null) => value ?? ''}
                onChange={(event) => setCountryQuery(event.target.value)}
                onBlur={() => setCountryQuery('')}
                placeholder={loadingCountries ? 'Chargement des pays...' : 'Rechercher un pays...'}
                className={fieldClass(countryError)}
              />
              <ComboboxButton
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                aria-label="Ouvrir la liste des pays"
              >
                <HiOutlineChevronDown className="h-5 w-5" />
              </ComboboxButton>
              <ComboboxOptions
                anchor="bottom start"
                className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg empty:hidden"
              >
                {countryNames.map((name) => (
                  <ComboboxOption
                    key={name}
                    value={name}
                    className={({ focus, selected }) =>
                      clsx(
                        'cursor-default select-none px-3 py-2 text-sm text-gray-900',
                        focus && 'bg-primary-50 text-primary-900',
                        selected && 'bg-primary-100 font-medium',
                      )
                    }
                  >
                    {name}
                  </ComboboxOption>
                ))}
                {!loadingCountries && countryNames.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Aucun pays trouvé.</div>
                )}
              </ComboboxOptions>
            </div>
          </Combobox>
          {countryError && <p className="mt-1 text-xs text-error-500">{countryError}</p>}
        </div>
      )}

      {cityUnavailable ? (
        <Input
          label={`${cityLabel}${required ? ' *' : ''}`}
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          error={cityError}
          disabled={disabled || !country}
          placeholder={country ? 'Saisir la ville' : 'Sélectionnez d’abord un pays'}
        />
      ) : (
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {cityLabel}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <Combobox
            value={city || null}
            onChange={(value: string | null) => {
              onCityChange(value ?? '');
              setCityQuery('');
            }}
            disabled={disabled || !selectedCountry || loadingCities}
          >
            <div className="relative">
              <ComboboxInput
                displayValue={(value: string | null) => value ?? ''}
                onChange={(event) => setCityQuery(event.target.value)}
                onBlur={() => setCityQuery('')}
                placeholder={
                  !selectedCountry
                    ? 'Sélectionnez d’abord un pays'
                    : loadingCities
                      ? 'Chargement des villes...'
                      : 'Rechercher une ville...'
                }
                className={fieldClass(cityError)}
              />
              <ComboboxButton
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-700"
                aria-label="Ouvrir la liste des villes"
              >
                <HiOutlineChevronDown className="h-5 w-5" />
              </ComboboxButton>
              <ComboboxOptions
                anchor="bottom start"
                className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg empty:hidden"
              >
                {cityNames.map((name) => (
                  <ComboboxOption
                    key={name}
                    value={name}
                    className={({ focus, selected }) =>
                      clsx(
                        'cursor-default select-none px-3 py-2 text-sm text-gray-900',
                        focus && 'bg-primary-50 text-primary-900',
                        selected && 'bg-primary-100 font-medium',
                      )
                    }
                  >
                    {name}
                  </ComboboxOption>
                ))}
                {!loadingCities && cityNames.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Aucune ville trouvée.</div>
                )}
              </ComboboxOptions>
            </div>
          </Combobox>
          {cityError && <p className="mt-1 text-xs text-error-500">{cityError}</p>}
        </div>
      )}
    </div>
  );
}
