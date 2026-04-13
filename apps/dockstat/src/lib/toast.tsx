import { toast as sonnerToast } from "sonner"
import { Toast, type ToastProps } from "@/components/toast"

export function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast
      button={toast.button}
      description={toast.description}
      id={id}
      title={toast.title}
      variant={toast.variant}
    />
  ))
}
