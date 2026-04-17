import { useTranslation } from 'react-i18next'
import { Bug, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'

const DebugMenu = () => {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="mr-2">
          <Bug className="mr-1 h-4 w-4" /> {t('debug.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> {t('debug.clearStorage')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <ExternalLink className="mr-2 h-4 w-4" /> {t('debug.submitBug')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default DebugMenu
