import type { ReactNode } from 'react';
import { HiOutlineInboxStack } from 'react-icons/hi2';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-gray-300 mb-4">
        {icon || <HiOutlineInboxStack className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
