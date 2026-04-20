import { useState } from 'react'
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
  const [showCredits, setShowCredits] = useState(false)

  return (
    <div className="w-full pb-1">
      <nav className="mb-1 px-3 bg-card border-b border-border rounded flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7" title="Feedback">
                <MessageSquarePlus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(buildIssueUrl(), '_blank')}>
                <Bug className="mr-2 h-4 w-4" /> Zgłoś błąd
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(buildFeatureUrl(), '_blank')}>
                <Lightbulb className="mr-2 h-4 w-4" /> Zaproponuj funkcję
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-auto px-1"
            title="O aplikacji / Credits"
            onClick={() => setShowCredits(true)}
          >
            <img src={a87Logo} alt="alucard87pl" className="h-5 w-auto" />
          </Button>
        </div>
      </nav>
      <CreditsModal show={showCredits} onHide={() => setShowCredits(false)} />
    </div>
  )
}

export default Header
