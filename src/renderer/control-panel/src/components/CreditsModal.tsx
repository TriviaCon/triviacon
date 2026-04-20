import { ExternalLink, Bug, Coffee } from 'lucide-react'
import { Dialog, DialogContent } from '@renderer/components/ui/dialog'
import Logo from './layout/Logo'
import { buildIssueUrl } from '@renderer/utils/issueUrl'
import a87Logo from '../assets/a87logo.png'

declare const __APP_VERSION__: string

// Official brand SVG paths (simple-icons, viewBox 0 0 24 24)
const ElectronIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4m7.473-2.277c.108.39.19.792.244 1.2.37 2.795-.239 4.83-1.744 5.69-1.464.833-3.494.264-5.56-1.39-2.07 1.663-4.107 2.238-5.574 1.4-1.51-.857-2.12-2.9-1.743-5.705a12.6 12.6 0 0 1 .244-1.195A12.9 12.9 0 0 1 4.1 9.23C2.602 7.27 2.178 5.355 3.104 4.1c.897-1.215 2.87-1.535 5.233-.929a12.6 12.6 0 0 1 1.16.37A12.9 12.9 0 0 1 10.377 3C10.9.276 12.09-.502 13.39.243c1.265.725 1.795 2.756 1.333 5.453a12.6 12.6 0 0 1-.244 1.155 12.9 12.9 0 0 1 1.196.49c2.246 1.12 3.614 2.766 3.018 4.382zm-1.347.52c-.19-.535-.493-1.085-.894-1.628a11.3 11.3 0 0 1-1.065.97 14 14 0 0 1-.086 1.428 14 14 0 0 1 1.203.501c.381-.39.69-.821.842-1.271m-1.686 2.903c-.222.57-.543 1.11-.941 1.61.49-.063.94-.162 1.34-.3.29-.618.407-1.267.37-1.883a12 12 0 0 1-.769.573m-1.762 1.986c-.512.307-1.043.527-1.57.655a11.4 11.4 0 0 0 1.204 1.073c.573-.356 1.066-.85 1.421-1.461-.346-.072-.703-.16-1.055-.267m-2.357.741a6.5 6.5 0 0 1-1.32-.001 10.7 10.7 0 0 0 .66.776 10.7 10.7 0 0 0 .66-.775m-2.352-.737c-.352.107-.71.195-1.055.267.355.611.848 1.105 1.421 1.461A11.4 11.4 0 0 0 9.54 15.87a6.5 6.5 0 0 1-1.571-.655M6.56 14.518a11.3 11.3 0 0 1-.769-.574c.037.616.154 1.265.44 1.883.4.139.85.238 1.34.301-.397-.5-.719-1.04-.94-1.61M5.47 12.617a12 12 0 0 1 1.203-.501 14 14 0 0 1-.087-1.428 11.3 11.3 0 0 1-1.065-.97c-.4.543-.703 1.093-.893 1.628.152.45.461.88.842 1.271m1.686-2.903c.221-.57.543-1.11.94-1.61-.49.063-.94.162-1.34.3-.29.618-.407 1.267-.37 1.883.24-.19.492-.37.77-.573m1.762-1.986c.512-.307 1.043-.527 1.57-.655A11.4 11.4 0 0 0 9.284 5.98c-.573.356-1.066.85-1.421 1.461.346.072.703.16 1.055.267m2.357-.741c.22.254.444.52.66.776a10.7 10.7 0 0 0 .66-.775 6.5 6.5 0 0 1-1.32-.001m2.352.737c.352-.107.71-.195 1.055-.267-.355-.611-.848-1.105-1.421-1.461a11.4 11.4 0 0 0-1.204 1.073c.527.128 1.058.348 1.57.655M15.44 9.48a11.3 11.3 0 0 1 .769.574c-.037-.616-.154-1.265-.44-1.883-.4-.139-.85-.238-1.34-.301.397.5.719 1.04.94 1.61m.599 1.095a12 12 0 0 1-.769.573 14 14 0 0 1-.087 1.428 11.3 11.3 0 0 1 1.203.501c.381-.39.69-.821.842-1.271-.19-.535-.493-1.085-.894-1.628a4 4 0 0 1-.295.397M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7" />
  </svg>
)

const ReactIcon = () => (
  <svg viewBox="-11.5 -10.232 23 20.463" className="w-3.5 h-3.5" fill="currentColor">
    <circle r="2.05" />
    <g fill="none" stroke="currentColor" strokeWidth="1">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
)

const TailwindIcon = () => (
  <svg viewBox="0 0 54 33" className="w-3.5 h-3.5" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C37.756 3.11 34.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C16.244 29.29 19.308 32.4 26.999 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C24.256 19.31 21.192 16.2 13.5 16.2z"
    />
  </svg>
)

const TECH_STACK = [
  {
    name: 'Electron',
    Icon: ElectronIcon,
    color: '#9FEAF9',
    bg: 'rgba(159,234,249,0.08)',
    border: 'rgba(159,234,249,0.25)',
    url: 'https://www.electronjs.org/'
  },
  {
    name: 'React',
    Icon: ReactIcon,
    color: '#61DAFB',
    bg: 'rgba(97,218,251,0.08)',
    border: 'rgba(97,218,251,0.25)',
    url: 'https://react.dev/'
  },
  {
    name: 'Tailwind CSS',
    Icon: TailwindIcon,
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.25)',
    url: 'https://tailwindcss.com/'
  }
]

interface CreditsModalProps {
  show: boolean
  onHide: () => void
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ show, onHide }) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-card via-muted/60 to-card px-6 py-5 flex items-center justify-center gap-2.5 border-b border-border">
          <Logo />
          <kbd className="rounded bg-background/60 border border-border px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            v{__APP_VERSION__}
          </kbd>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Author */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Developed by
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <img src={a87Logo} alt="alucard87pl" className="h-5 w-auto opacity-90" />
                <span className="text-xs text-muted-foreground">idea, code</span>
              </div>
              <div className="flex items-start gap-2 rounded-md bg-muted/50 border border-border px-3 py-2">
                <Coffee className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Heavily vibe-coded at ungodly hours, fueled by an unrelenting caffeine addiction
                  and a stubborn belief that convention quizzing deserves better software.
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                ...and an extensive list of brave beta testers
              </p>
            </div>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Built with
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TECH_STACK.map(({ name, Icon, color, bg, border, url }) => (
                <button
                  key={name}
                  onClick={() => window.open(url, '_blank')}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-75 cursor-pointer border"
                  style={{ color, backgroundColor: bg, borderColor: border }}
                >
                  <Icon />
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground">MIT License</span>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  window.open('https://github.com/TriviaCon/triviacon', '_blank')
                }}
              >
                <ExternalLink className="h-3 w-3" /> GitHub
              </a>
              <a
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  window.open(buildIssueUrl(), '_blank')
                }}
              >
                <Bug className="h-3 w-3" /> Report issue
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
