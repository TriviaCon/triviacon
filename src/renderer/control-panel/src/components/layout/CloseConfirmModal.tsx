import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'

export function CloseConfirmModal() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const unsub = window.api.onCloseRequest(() => setOpen(true))
    return unsub
  }, [])

  const respond = (choice: 'save' | 'discard' | 'cancel') => {
    setOpen(false)
    window.api.closeRespond(choice)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{t('confirm.unsavedChangesTitle')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t('confirm.unsavedChanges')}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => respond('cancel')}>
            {t('actions.cancel')}
          </Button>
          <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => respond('discard')}>
            {t('confirm.dontSave')}
          </Button>
          <Button onClick={() => respond('save')}>
            <Save className="mr-2 h-4 w-4" />
            {t('actions.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
