import { useState, InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Affiche un bouton œil pour afficher/masquer le mot de passe */
  passwordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, type, passwordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const isPassword = type === 'password' || passwordToggle;
    const inputType = passwordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={clsx(
              'w-full rounded-lg border px-3 py-2 text-sm transition-colors placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error ? 'border-error-200 focus:ring-error-400 focus:border-error-400' : 'border-gray-300',
              isPassword && 'pr-10',
              className,
            )}
            {...props}
          />
          {passwordToggle && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <HiOutlineEyeSlash className="h-5 w-5" />
              ) : (
                <HiOutlineEye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
export default Input;
