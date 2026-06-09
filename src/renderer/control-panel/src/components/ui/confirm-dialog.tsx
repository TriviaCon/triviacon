import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel() }}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>{t('actions.cancel')}</Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={() => { onConfirm(); onCancel() }}>
            {confirmLabel ?? t('actions.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
