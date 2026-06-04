import Input from '@/components/ui/Input';
import { formatMoneyInput } from '@/lib/money';

interface MoneyInputProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function MoneyInput({
  label,
  value = '',
  onChange,
  placeholder,
  error,
  disabled,
  id,
  className,
}: MoneyInputProps) {
  return (
    <Input
      id={id}
      label={label}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      error={error}
      disabled={disabled}
      className={className}
      onChange={(e) => onChange(formatMoneyInput(e.target.value))}
    />
  );
}
