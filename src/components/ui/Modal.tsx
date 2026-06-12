import { Fragment, ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { HiXMark } from 'react-icons/hi2';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-3xl' };

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-100"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-75"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/35" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <DialogPanel className={`w-full ${sizeMap[size]} bg-white rounded-2xl shadow-xl transform-gpu will-change-transform`}>
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
                  <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>
              )}
              <div className="p-6">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
