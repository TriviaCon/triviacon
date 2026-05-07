import { describe, it, expect, beforeEach } from 'vitest'
import { GameEngine } from './GameEngine'
import { GamePhase } from '@shared/types/state'
import type { AnswerOption, Category, Question, QuizMeta } from '@shared/types/quiz'

const meta: QuizMeta = {
  name: 'Test Quiz',
  author: 'Author',
  location: 'Here',
  date: '2026-01-01',
  splash: ''
}

const categories: Category[] = [
  { id: 1, name: 'Science', questionCount: 2 },
  { id: 2, name: 'History', questionCount: 1 }
]

const questionCategoryMap: Record<number, number> = { 10: 1, 11: 1, 20: 2 }

const question: Question = {
  id: 10,
  categoryId: 1,
  type: 'multiple-choice',
  text: 'What is 2+2?',
  media: null
}

const answerOptions: AnswerOption[] = [
  { id: 100, questionId: 10, text: '3', correct: false, sortOrder: 0 },
  { id: 101, questionId: 10, text: '4', correct: true, sortOrder: 1 }
]

describe('GameEngine', () => {
  let engine: GameEngine

  beforeEach(() => {
    engine = new GameEngine()
  })

  describe('initial state', () => {
    it('starts in Idle phase with no teams', () => {
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Idle)
      expect(s.teams).toEqual([])
      expect(s.currentTeamId).toBeNull()
    })
  })

  describe('loadQuiz', () => {
    it('sets phase to Builder with quiz data', () => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Builder)
      expect(s.quizFilePath).toBe('/test.tcq')
      expect(s.quizMeta).toEqual(meta)
      expect(s.categories).toEqual(categories)
    })

    it('restores saved teams and sets currentTeamId', () => {
      const teams = [
        { id: 't5', name: 'Alpha', score: 10 },
        { id: 't8', name: 'Beta', score: 20 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      const s = engine.getState()
      expect(s.teams).toEqual(teams)
      expect(s.currentTeamId).toBe('t5')
    })

    it('restores nextTeamId counter past saved teams', () => {
      const teams = [{ id: 't5', name: 'Alpha', score: 0 }]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      engine.addTeam('New')
      const newTeam = engine.getState().teams.find((t) => t.name === 'New')
      expect(newTeam).toBeDefined()
      expect(parseInt(newTeam!.id.replace('t', ''), 10)).toBeGreaterThanOrEqual(6)
    })
  })

  describe('team management', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
    })

    it('addTeam creates a team and sets it as current if first', () => {
      engine.addTeam('Team A')
      const s = engine.getState()
      expect(s.teams).toHaveLength(1)
      expect(s.teams[0].name).toBe('Team A')
      expect(s.teams[0].score).toBe(0)
      expect(s.currentTeamId).toBe(s.teams[0].id)
    })

    it('removeTeam removes and updates currentTeamId', () => {
      engine.addTeam('A')
      engine.addTeam('B')
      const idA = engine.getState().teams[0].id
      engine.removeTeam(idA)
      const s = engine.getState()
      expect(s.teams).toHaveLength(1)
      expect(s.teams[0].name).toBe('B')
      expect(s.currentTeamId).toBe(s.teams[0].id)
    })

    it('renameTeam updates team name', () => {
      engine.addTeam('Old')
      const id = engine.getState().teams[0].id
      engine.renameTeam(id, 'New')
      expect(engine.getState().teams[0].name).toBe('New')
    })

    it('updateScore adjusts team score by delta', () => {
      engine.addTeam('A')
      const id = engine.getState().teams[0].id
      engine.updateScore(id, 5)
      engine.updateScore(id, -2)
      expect(engine.getState().teams[0].score).toBe(3)
    })
  })

  describe('team cycling', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
      engine.addTeam('A')
      engine.addTeam('B')
      engine.addTeam('C')
    })

    it('nextTeam cycles forward', () => {
      const ids = engine.getState().teams.map((t) => t.id)
      expect(engine.getState().currentTeamId).toBe(ids[0])
      engine.nextTeam()
      expect(engine.getState().currentTeamId).toBe(ids[1])
      engine.nextTeam()
      expect(engine.getState().currentTeamId).toBe(ids[2])
      engine.nextTeam()
      expect(engine.getState().currentTeamId).toBe(ids[0])
    })

    it('prevTeam cycles backward', () => {
      const ids = engine.getState().teams.map((t) => t.id)
      engine.prevTeam()
      expect(engine.getState().currentTeamId).toBe(ids[2])
      engine.prevTeam()
      expect(engine.getState().currentTeamId).toBe(ids[1])
    })
  })

  describe('screen transitions', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
    })

    it('showSplash sets Splash phase', () => {
      engine.showSplash()
      expect(engine.getState().phase).toBe(GamePhase.Splash)
    })

    it('showCategories sets Categories phase and clears question state', () => {
      engine.showCategories()
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Categories)
      expect(s.currentCategoryId).toBeNull()
      expect(s.activeQuestion).toBeNull()
    })

    it('showQuestions sets Questions phase with category data', () => {
      engine.showQuestions(1, [question])
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Questions)
      expect(s.currentCategoryId).toBe(1)
      expect(s.categoryQuestions).toEqual([question])
    })

    it('showQuestion sets Question phase with answer options', () => {
      engine.showQuestion(question, answerOptions)
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Question)
      expect(s.activeQuestion?.question).toEqual(question)
      expect(s.activeQuestion?.answerOptions).toEqual(answerOptions)
      expect(s.activeQuestion?.answerRevealed).toBe(false)
      expect(s.activeQuestion?.markedAnswerId).toBeNull()
    })

    it('showRanking sets Ranking phase', () => {
      engine.showRanking()
      expect(engine.getState().phase).toBe(GamePhase.Ranking)
    })
  })

  describe('question state', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
      engine.showQuestion(question, answerOptions)
    })

    it('toggleAnswer reveals then hides answer', () => {
      engine.toggleAnswer(10)
      expect(engine.getState().activeQuestion?.answerRevealed).toBe(true)
      expect(engine.getState().revealedAnswers).toContain(10)

      engine.toggleAnswer(10)
      expect(engine.getState().activeQuestion?.answerRevealed).toBe(false)
      expect(engine.getState().revealedAnswers).not.toContain(10)
    })

    it('markUsed toggles used state', () => {
      engine.markUsed(10)
      expect(engine.getState().usedQuestions).toContain(10)
      engine.markUsed(10)
      expect(engine.getState().usedQuestions).not.toContain(10)
    })

    it('markAnswer sets markedAnswerId', () => {
      engine.markAnswer(101)
      expect(engine.getState().activeQuestion?.markedAnswerId).toBe(101)
      engine.markAnswer(null)
      expect(engine.getState().activeQuestion?.markedAnswerId).toBeNull()
    })
  })

  describe('dark mode', () => {
    it('toggleDarkMode flips the flag', () => {
      expect(engine.getState().gameScreenDarkMode).toBe(false)
      engine.toggleDarkMode()
      expect(engine.getState().gameScreenDarkMode).toBe(true)
      engine.toggleDarkMode()
      expect(engine.getState().gameScreenDarkMode).toBe(false)
    })
  })

  describe('selection', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
    })

    it('selectCategory sets selectedCategoryId and clears selectedQuestionId', () => {
      engine.selectQuestion(10)
      engine.selectCategory(1)
      const s = engine.getState()
      expect(s.selectedCategoryId).toBe(1)
      expect(s.selectedQuestionId).toBeNull()
    })

    it('selectQuestion sets selectedQuestionId', () => {
      engine.selectQuestion(10)
      expect(engine.getState().selectedQuestionId).toBe(10)
    })

    it('selectCategory(null) clears selection', () => {
      engine.selectCategory(1)
      engine.selectCategory(null)
      expect(engine.getState().selectedCategoryId).toBeNull()
    })

    it('selectQuestion(null) clears selection', () => {
      engine.selectQuestion(10)
      engine.selectQuestion(null)
      expect(engine.getState().selectedQuestionId).toBeNull()
    })

    it('showCategories clears both selection fields', () => {
      engine.selectCategory(1)
      engine.showCategories()
      const s = engine.getState()
      expect(s.selectedCategoryId).toBeNull()
      expect(s.selectedQuestionId).toBeNull()
    })

    it('showQuestions clears both selection fields', () => {
      engine.selectCategory(1)
      engine.showQuestions(1, [question])
      const s = engine.getState()
      expect(s.selectedCategoryId).toBeNull()
      expect(s.selectedQuestionId).toBeNull()
    })

    it('showQuestion clears both selection fields', () => {
      engine.selectQuestion(10)
      engine.showQuestion(question, answerOptions)
      const s = engine.getState()
      expect(s.selectedCategoryId).toBeNull()
      expect(s.selectedQuestionId).toBeNull()
    })

    it('showSplash clears both selection fields', () => {
      engine.selectCategory(1)
      engine.showSplash()
      const s = engine.getState()
      expect(s.selectedCategoryId).toBeNull()
      expect(s.selectedQuestionId).toBeNull()
    })

    it('showRanking clears both selection fields', () => {
      engine.selectCategory(1)
      engine.showRanking()
      const s = engine.getState()
      expect(s.selectedCategoryId).toBeNull()
      expect(s.selectedQuestionId).toBeNull()
    })
  })

  describe('closeQuiz', () => {
    it('resets to initial state', () => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
      engine.addTeam('A')
      engine.closeQuiz()
      const s = engine.getState()
      expect(s.phase).toBe(GamePhase.Idle)
      expect(s.teams).toEqual([])
      expect(s.quizFilePath).toBeNull()
    })
  })
})
