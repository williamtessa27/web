import { useMemo, useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import {
  PHONE_COUNTRIES,
  DEFAULT_PHONE_INDICATIF,
  buildE164,
  parseE164,
} from '@/lib/phone';

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (e164: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Texte d'aide sous le champ */
  hint?: string;
}

/**
 * Champ téléphone avec sélecteur de pays (indicatif) intégré.
 * Valeur exposée en E.164. Pays par défaut : Cameroun (+237).
 */
export default function PhoneInput({
  label,
  value = '',
  onChange,
  onBlur,
  placeholder = '6 57 78 05 96',
  error,
  required,
  disabled,
  id,
  className,
  hint,
}: PhoneInputProps) {
  const parsed = useMemo(() => parseE164(value), [value]);
  const [indicatif, setIndicatif] = useState(parsed.indicatif);
  const [national, setNational] = useState(parsed.national);

  useEffect(() => {
    setIndicatif(parsed.indicatif);
    setNational(parsed.national);
  }, [parsed.indicatif, parsed.national]);

  const syncFromValue = useCallback(() => {
    const p = parseE164(value);
    setIndicatif(p.indicatif);
    setNational(p.national);
  }, [value]);

  const handleIndicatifChange = (newIndicatif: string) => {
    setIndicatif(newIndicatif);
    const e164 = buildE164(newIndicatif, national);
    onChange?.(e164);
  };

  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setNational(v);
    const e164 = buildE164(indicatif, v);
    onChange?.(e164);
  };

  const inputId = id ?? (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <select
          aria-label="Indicatif pays"
          value={indicatif}
          onChange={(e) => handleIndicatifChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={clsx(
            'w-28 shrink-0 rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-error-200 focus:ring-error-400'
              : 'border-gray-300 bg-white',
            disabled && 'bg-gray-100 text-gray-500',
          )}
        >
          {PHONE_COUNTRIES.map((p) => (
            <option key={p.code} value={p.indicatif}>
              +{p.indicatif} {p.code}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={national}
          onChange={handleNationalChange}
          onBlur={onBlur}
          onFocus={syncFromValue}
          disabled={disabled}
          className={clsx(
            'flex-1 min-w-0 rounded-lg border px-3 py-2 text-sm transition-colors placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-error-200 focus:ring-error-400 focus:border-error-400'
              : 'border-gray-300',
            disabled && 'bg-gray-100 text-gray-500',
          )}
        />
      </div>
      {hint && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-error-500">{error}</p>
      )}
    </div>
  );
}
