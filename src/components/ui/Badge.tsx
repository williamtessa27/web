import clsx from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-accent-50 text-accent-600 ring-accent-400/20',
  warning: 'bg-warning-50 text-warning-600 ring-warning-500/20',
  danger: 'bg-error-50 text-error-600 ring-error-500/20',
  info: 'bg-secondary-50 text-secondary-600 ring-secondary-500/20',
  neutral: 'bg-gray-50 text-gray-700 ring-gray-600/20',
};

export default function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
