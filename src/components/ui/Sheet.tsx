import { Fragment, ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { HiXMark } from 'react-icons/hi2';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Largeur du drawer (défaut: md = 28rem) */
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

/**
 * Drawer / Sheet qui s'ouvre depuis la droite vers la gauche.
 * Style type shadcn Sheet, sans dépendance Radix.
 */
export default function Sheet({ open, onClose, title, children, size = 'md' }: SheetProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <DialogPanel
              className={`w-full ${sizeMap[size]} h-full bg-white shadow-xl flex flex-col overflow-hidden`}
            >
              {title != null && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                  <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Fermer"
                  >
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-6">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
