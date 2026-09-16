import { cn } from '@renderer/lib/utils'

const sizes = {
  md: 'text-xl',
  lg: 'text-2xl'
} as const

const Logo: React.FC<{ size?: keyof typeof sizes }> = ({ size = 'md' }) => {
  return (
    <h4 className={cn('text-center mb-0 select-none', sizes[size])}>
      <span className="text-foreground">Trivia</span>
      <span className="font-bold logo-rainbow">CON</span>
    </h4>
  )
}

export default Logo
