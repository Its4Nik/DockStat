'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

type ToasterProps = {
  position:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center'
}

export const Toaster = ({ position }: ToasterProps) => {
  return (
    <SonnerToaster
      position={position}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'w-full flex items-center p-4 rounded-lg shadow-lg border gap-2 bg-components-sonner-bg border-components-sonner-border text-components-sonner-color',
          title: 'font-medium text-components-sonner-title-font-size',
          description:
            'text-components-sonner-description-font-size opacity-90',
          actionButton:
            'px-3 py-1 text-components-sonner-button-font-size rounded-md bg-components-sonner-button-bg text-components-sonner-button-color',
          cancelButton:
            'px-3 py-1 text-components-sonner-button-font-size rounded-md bg-components-sonner-cancel-bg text-components-sonner-cancel-color',
          closeButton:
            'bg-components-sonner-close-bg rounded-md p-1 text-components-sonner-close-color',
          success:
            'bg-components-sonner-success-bg border-components-sonner-success-border text-components-sonner-success-color',
          error:
            'bg-components-sonner-error-bg border-components-sonner-error-border text-components-sonner-error-color',
          warning:
            'bg-components-sonner-warning-bg border-components-sonner-warning-border text-components-sonner-warning-color',
          info: 'bg-components-sonner-info-bg border-components-sonner-info-border text-components-sonner-info-color',
          loading:
            'bg-components-sonner-loading-bg border-components-sonner-loading-border text-components-sonner-loading-color',
        },
      }}
    />
  )
}

export const toast = sonnerToast
