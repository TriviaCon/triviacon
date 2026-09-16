import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Lightbulb, MessageSquarePlus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import Logo from './Logo'
import { CreditsModal } from '../CreditsModal'
import { buildIssueUrl, buildFeatureUrl } from '@renderer/utils/issueUrl'
import a87Logo from '../../assets/a87logo.png'

const Header = () => {
  const { t } = useTranslation()
  const [showCredits, setShowCredits] = useState(false)

  return (
    <div className="w-full border-b border-border">
      <nav className="mb-1 px-3 pb-0.5 bg-card rounded flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                title={t('header.feedback')}
                aria-label={t('header.feedback')}
              >
                <MessageSquarePlus />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(buildIssueUrl(), '_blank')}>
                <Bug className="mr-2 h-4 w-4" /> {t('header.reportBug')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(buildFeatureUrl(), '_blank')}>
                <Lightbulb className="mr-2 h-4 w-4" /> {t('header.suggestFeature')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            className="group w-auto px-1.5"
            title={t('header.credits')}
            aria-label={t('header.credits')}
            onClick={() => setShowCredits(true)}
          >
            <img
              src={a87Logo}
              alt="alucard87pl"
              className="h-4 w-auto opacity-80 transition-opacity group-hover:opacity-100"
            />
          </Button>
        </div>
      </nav>
      <CreditsModal show={showCredits} onHide={() => setShowCredits(false)} />
    </div>
  )
}

export default Header
