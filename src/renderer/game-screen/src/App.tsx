import './index.css'
import { useEffect } from 'react'
import { useGameState } from './hooks/useGameState'
import { GamePhase } from '@shared/types/state'
import IdleScreen from './components/IdleScreen'
import CategoriesScreen from './components/CategoriesScreen'
import QuestionsScreen from './components/QuestionsScreen'
import QuestionScreen from './components/QuestionScreen'
import RankingScreen from './components/RankingScreen'

function App() {
  const gameState = useGameState()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', gameState.gameScreenDarkMode)
  }, [gameState.gameScreenDarkMode])

  switch (gameState.phase) {
    case GamePhase.Categories:
      return (
        <CategoriesScreen
          categories={gameState.categories}
          usedQuestions={gameState.usedQuestions}
          questionCategoryMap={gameState.questionCategoryMap}
          selectedCategoryId={gameState.selectedCategoryId}
        />
      )
    case GamePhase.Questions:
      return (
        <QuestionsScreen
          categories={gameState.categories}
          currentCategoryId={gameState.currentCategoryId}
          questions={gameState.categoryQuestions}
          usedQuestions={gameState.usedQuestions}
          selectedQuestionId={gameState.selectedQuestionId}
        />
      )
    case GamePhase.Question:
      return <QuestionScreen activeQuestion={gameState.activeQuestion} />
    case GamePhase.Ranking:
      return <RankingScreen teams={gameState.teams} />
    case GamePhase.Splash:
    default:
      return <IdleScreen quizMeta={gameState.quizMeta} />
  }
}

export default App
