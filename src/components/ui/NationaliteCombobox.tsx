import { useState, useMemo } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import clsx from 'clsx';
import { PAYS_NATIONALITES } from '@/data/pays';

export interface NationaliteComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export default function NationaliteCombobox({
  value = '',
  onChange,
  label = 'Nationalité',
  placeholder = 'Rechercher ou sélectionner un pays...',
  error,
  disabled = false,
}: NationaliteComboboxProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return PAYS_NATIONALITES;
    const q = query.toLowerCase().trim();
    return PAYS_NATIONALITES.filter((p) => p.toLowerCase().includes(q));
  }, [query]);

  const displayValue = value || '';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <Combobox
        value={value && value.trim() ? value : null}
        onChange={(v) => onChange?.(v ?? '')}
        disabled={disabled}
      >
        <div className="relative">
          <ComboboxInput
            displayValue={() => displayValue}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => setQuery('')}
            placeholder={placeholder}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-colors placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error
                ? 'border-error-200 focus:ring-error-400 focus:border-error-400'
                : 'border-gray-300',
              disabled && 'bg-gray-50 cursor-not-allowed opacity-70',
            )}
          />
          <Combobox.Button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-500 hover:text-gray-700"
            aria-label="Ouvrir la liste"
          >
            <HiOutlineChevronDown className="h-5 w-5" />
          </Combobox.Button>
          <ComboboxOptions
            anchor="bottom start"
            className={clsx(
              'mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
              'empty:hidden',
            )}
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Aucun pays trouvé.</div>
            ) : (
              filtered.map((pays) => (
                <ComboboxOption
                  key={pays}
                  value={pays}
                  className={({ focus, selected }) =>
                    clsx(
                      'relative cursor-default select-none px-3 py-2 text-sm',
                      focus && 'bg-primary-50 text-primary-900',
                      !focus && 'text-gray-900',
                      selected && 'bg-primary-100 font-medium',
                    )
                  }
                >
                  {pays}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
    </div>
  );
}
