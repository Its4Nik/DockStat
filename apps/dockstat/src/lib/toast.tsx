import { toast as sonnerToast } from "sonner"
import { Toast, type ToastProps } from "@/components/toast"

export function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast
      id={id}
      title={toast.title}
      description={toast.description}
      button={toast.button}
      variant={toast.variant}
    />
  ))
}
