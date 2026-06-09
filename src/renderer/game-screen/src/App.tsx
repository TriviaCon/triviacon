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
    case GamePhase.Question: {
      const category = gameState.categories.find((c) => c.id === gameState.currentCategoryId)
      const questionIndex = gameState.activeQuestion
        ? gameState.categoryQuestions.findIndex(
            (q) => q.id === gameState.activeQuestion!.question.id
          ) + 1
        : 0
      const currentTeam = gameState.teams.find((t) => t.id === gameState.currentTeamId)
      return (
        <QuestionScreen
          activeQuestion={gameState.activeQuestion}
          categoryName={category?.name ?? null}
          questionIndex={questionIndex}
          currentTeamName={currentTeam?.name ?? null}
          timer={gameState.timer}
          timerDuration={gameState.quizMeta?.timerSeconds ?? 0}
          timerSound={gameState.timerSound}
        />
      )
    }
    case GamePhase.Ranking:
      return <RankingScreen teams={gameState.teams} revealed={gameState.rankingRevealed} />
    case GamePhase.Splash:
    default:
      return <IdleScreen quizMeta={gameState.quizMeta} />
  }
}

export default App
