import { Toaster as SonnerToaster } from 'sonner'

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
            'w-full flex items-center p-4 rounded-lg shadow-lg border gap-2 bg-sonner-bg border-sonner-border text-sonner-color',
          title: 'font-medium text-sonner-title-font-size',
          description:
            'text-sonner-description-font-size opacity-90',
          actionButton:
            'px-3 py-1 text-sonner-button-font-size rounded-md bg-sonner-button-bg text-sonner-button-color',
          cancelButton:
            'px-3 py-1 text-sonner-button-font-size rounded-md bg-sonner-cancel-bg text-sonner-cancel-color',
          closeButton:
            'bg-sonner-close-bg rounded-md p-1 text-sonner-close-color',
          success:
            'bg-sonner-success-bg border-sonner-success-border text-sonner-success-color',
          error:
            'bg-sonner-error-bg border-sonner-error-border text-sonner-error-color',
          warning:
            'bg-sonner-warning-bg border-sonner-warning-border text-sonner-warning-color',
          info: 'bg-sonner-info-bg border-sonner-info-border text-sonner-info-color',
          loading:
            'bg-sonner-loading-bg border-sonner-loading-border text-sonner-loading-color',
        },
      }}
    />
  )
}
