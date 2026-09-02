import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useModalStore } from "@/store/useModalStore"

export function GlobalModal() {
  const { isOpen, data, closeModal } = useModalStore()

  if (!data) return null;

  const handleConfirm = () => {
    if (data.onConfirm) data.onConfirm();
    closeModal();
  }

  const handleCancel = () => {
    if (data.onCancel) data.onCancel();
    closeModal();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{data.title || "Confirmar ação"}</AlertDialogTitle>
          <AlertDialogDescription>
            {data.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {data.cancelText || "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {data.confirmText || "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
