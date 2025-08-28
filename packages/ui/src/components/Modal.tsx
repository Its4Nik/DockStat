import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import type { ReactNode } from 'react'
import { Fragment } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Overlay */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-dialog-overlay-bg" />
        </TransitionChild>

        {/* Panel */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <DialogPanel className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-dialog-radius bg-dialog-bg p-dialog-padding shadow-dialog-shadow">
            {children}
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
