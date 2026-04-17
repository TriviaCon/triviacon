import { useTranslation } from 'react-i18next'
import type { QuizMeta } from '@shared/types/quiz'

const IdleScreen = ({ quizMeta }: { quizMeta: QuizMeta | null }) => {
  const { t } = useTranslation()
  const hasSplash = quizMeta?.splash && quizMeta.splash.length > 0

  return (
    <div className="flex items-center justify-center h-screen bg-background text-foreground">
      <div className="text-center">
        {hasSplash ? (
          <img
            src={quizMeta.splash}
            alt={quizMeta.name || t('app.name')}
            className="max-h-[80vh] max-w-[90vw] object-contain mx-auto mb-6 rounded-lg"
          />
        ) : (
          <h1 className="text-[5rem] mb-4 font-bold">{quizMeta?.name || t('app.name')}</h1>
        )}
        {quizMeta?.location && <h2 className="text-[3rem]">{quizMeta.location}</h2>}
        {quizMeta?.date && <h3 className="text-[2rem] opacity-70">{quizMeta.date}</h3>}
        {quizMeta?.author && (
          <p className="text-2xl opacity-50">{t('gameScreen.byAuthor', { author: quizMeta.author })}</p>
        )}
        {!quizMeta && <p className="text-xl opacity-70">{t('app.waitingForData')}</p>}
      </div>
    </div>
  )
}

export default IdleScreen
