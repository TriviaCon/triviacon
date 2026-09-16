import { describe, it, expect, beforeEach } from 'vitest'
import { GameEngine } from './GameEngine'
import { GamePhase } from '@shared/types/state'
import type { AnswerOption, Category, Question, QuizMeta } from '@shared/types/quiz'

const meta: QuizMeta = {
  name: 'Test Quiz',
  author: 'Author',
  location: 'Here',
  date: '2026-01-01',
  splash: '',
  timerSeconds: 0
}

const categories: Category[] = [
  { id: 1, name: 'Science', questionCount: 2, sortOrder: 0 },
  { id: 2, name: 'History', questionCount: 1, sortOrder: 1 }
]

const questionCategoryMap: Record<number, number> = { 10: 1, 11: 1, 20: 2 }

const question: Question = {
  id: 10,
  categoryId: 1,
  type: 'multiple-choice',
  text: 'What is 2+2?',
  media: null,
  sortOrder: 0
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
        { id: 't5', name: 'Alpha', score: 10, tiebreakScore: 0 },
        { id: 't8', name: 'Beta', score: 20, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      const s = engine.getState()
      expect(s.teams).toEqual(teams)
      expect(s.currentTeamId).toBe('t5')
    })

    it('restores nextTeamId counter past saved teams', () => {
      const teams = [{ id: 't5', name: 'Alpha', score: 0, tiebreakScore: 0 }]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      engine.addTeam('New')
      const newTeam = engine.getState().teams.find((t) => t.name === 'New')
      expect(newTeam).toBeDefined()
      expect(parseInt(newTeam!.id.replace('t', ''), 10)).toBeGreaterThanOrEqual(6)
    })

    it('gives every added team its own id when saved ids are UUIDs', () => {
      // Stripping the non-digits out of a UUID lands past MAX_SAFE_INTEGER,
      // where ++ stops incrementing and every added team shared one id.
      const teams = [
        { id: 'dc4ac40c-4472-4079-8061-05798bd4936d', name: 'Alpha', score: 0, tiebreakScore: 0 },
        { id: '28491901-8690-4e0f-92c7-8220dd66a12f', name: 'Beta', score: 0, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      engine.addTeam('One')
      engine.addTeam('Two')
      engine.addTeam('Three')
      const added = engine.getState().teams.filter((t) => t.id.startsWith('t'))
      expect(added).toHaveLength(3)
      for (const t of added) expect(t.id).toMatch(/^t\d+$/)
      expect(new Set(added.map((t) => t.id)).size).toBe(3)
    })

    it('renames only the team that was asked for', () => {
      const teams = [
        { id: 'dc4ac40c-4472-4079-8061-05798bd4936d', name: 'Alpha', score: 0, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      engine.addTeam('One')
      engine.addTeam('Two')
      const [, one, two] = engine.getState().teams
      engine.renameTeam(two.id, 'Renamed')
      const after = engine.getState().teams
      expect(after.find((t) => t.id === two.id)!.name).toBe('Renamed')
      expect(after.find((t) => t.id === one.id)!.name).toBe('One')
    })

    it('gives repeated ids fresh ones on load, first holder keeps it', () => {
      // What a quiz saved while the counter was broken looks like.
      const dupe = 't4.404472407980611e+23'
      const teams = [
        { id: 'dc4ac40c-4472-4079-8061-05798bd4936d', name: 'Alpha', score: 5, tiebreakScore: 1 },
        { id: dupe, name: 'Beta', score: 10, tiebreakScore: 0 },
        { id: dupe, name: 'Gamma', score: 20, tiebreakScore: 2 },
        { id: dupe, name: 'Delta', score: 30, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      const loaded = engine.getState().teams

      expect(loaded.map((t) => t.name)).toEqual(['Alpha', 'Beta', 'Gamma', 'Delta'])
      expect(new Set(loaded.map((t) => t.id)).size).toBe(4)
      expect(loaded[0].id).toBe('dc4ac40c-4472-4079-8061-05798bd4936d')
      expect(loaded[1].id).toBe(dupe)
      expect(loaded.map((t) => t.score)).toEqual([5, 10, 20, 30])
      expect(loaded.map((t) => t.tiebreakScore)).toEqual([1, 0, 2, 0])
    })

    it('leaves already-unique ids exactly as the file wrote them', () => {
      const teams = [
        { id: 'dc4ac40c-4472-4079-8061-05798bd4936d', name: 'Alpha', score: 0, tiebreakScore: 0 },
        { id: 'not-a-uuid-either', name: 'Beta', score: 0, tiebreakScore: 0 },
        { id: 't7', name: 'Gamma', score: 0, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      expect(engine.getState().teams.map((t) => t.id)).toEqual([
        'dc4ac40c-4472-4079-8061-05798bd4936d',
        'not-a-uuid-either',
        't7'
      ])
    })

    it('scores a de-duplicated team on its own', () => {
      const dupe = 'tX'
      const teams = [
        { id: dupe, name: 'Beta', score: 0, tiebreakScore: 0 },
        { id: dupe, name: 'Gamma', score: 0, tiebreakScore: 0 }
      ]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      const [beta, gamma] = engine.getState().teams
      engine.updateScore(gamma.id, 3)
      const after = engine.getState().teams
      expect(after.find((t) => t.id === gamma.id)!.score).toBe(3)
      expect(after.find((t) => t.id === beta.id)!.score).toBe(0)
    })

    it('skips an id a loaded quiz already uses', () => {
      const teams = [{ id: 't1', name: 'Alpha', score: 0, tiebreakScore: 0 }]
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap, teams)
      engine.addTeam('New')
      const ids = engine.getState().teams.map((t) => t.id)
      expect(new Set(ids).size).toBe(ids.length)
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

    it('addTeam starts with a zero tiebreak sub-score', () => {
      engine.addTeam('A')
      expect(engine.getState().teams[0].tiebreakScore).toBe(0)
    })

    it('updateTiebreakScore adjusts the sub-score without touching the main score, floored at 0', () => {
      engine.addTeam('A')
      const id = engine.getState().teams[0].id
      engine.updateTiebreakScore(id, 2)
      engine.updateTiebreakScore(id, -1)
      expect(engine.getState().teams[0].tiebreakScore).toBe(1)
      expect(engine.getState().teams[0].score).toBe(0)
      engine.updateTiebreakScore(id, -5)
      expect(engine.getState().teams[0].tiebreakScore).toBe(0)
    })

    it('starting a tiebreaker resets sub-scores for its teams only', () => {
      engine.addTeam('A')
      engine.addTeam('B')
      engine.addTeam('C')
      const [a, b, c] = engine.getState().teams.map((t) => t.id)
      engine.updateTiebreakScore(a, 3)
      engine.updateTiebreakScore(c, 4)
      engine.setTiebreaker([a, b])
      const s = engine.getState()
      expect(s.teams.find((t) => t.id === a)!.tiebreakScore).toBe(0)
      expect(s.teams.find((t) => t.id === c)!.tiebreakScore).toBe(4)
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

  describe('team order + round', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
      engine.addTeam('A')
      engine.addTeam('B')
      engine.addTeam('C')
    })

    it('starts unlocked at round 1', () => {
      const s = engine.getState()
      expect(s.teamOrderLocked).toBe(false)
      expect(s.round).toBe(1)
    })

    it('reorderTeams reorders the authoritative array', () => {
      const [a, b, c] = engine.getState().teams.map((t) => t.id)
      engine.reorderTeams([c, a, b])
      expect(engine.getState().teams.map((t) => t.id)).toEqual([c, a, b])
    })

    it('reorderTeams ignores a partial id list that would drop teams', () => {
      const ids = engine.getState().teams.map((t) => t.id)
      engine.reorderTeams([ids[0]])
      expect(engine.getState().teams.map((t) => t.id)).toEqual(ids)
    })

    it('round only advances on a full forward lap while locked', () => {
      engine.nextTeam()
      engine.nextTeam()
      engine.nextTeam() // wraps C -> A, but unlocked
      expect(engine.getState().round).toBe(1)

      engine.setTeamOrderLocked(true)
      engine.nextTeam() // A -> B
      engine.nextTeam() // B -> C
      expect(engine.getState().round).toBe(1)
      engine.nextTeam() // C -> A, full lap
      expect(engine.getState().round).toBe(2)
    })

    it('prevTeam rewinds the round on a backward lap, floored at 1', () => {
      engine.setTeamOrderLocked(true)
      engine.nextTeam()
      engine.nextTeam()
      engine.nextTeam() // round 2, back at A
      expect(engine.getState().round).toBe(2)
      engine.prevTeam() // A -> C, backward lap
      expect(engine.getState().round).toBe(1)
      engine.prevTeam() // C -> B, no wrap
      expect(engine.getState().round).toBe(1)
    })

    it('round is frozen during a tiebreaker', () => {
      const ids = engine.getState().teams.map((t) => t.id)
      engine.setTeamOrderLocked(true)
      engine.setTiebreaker([ids[0], ids[1]])
      engine.nextTeam()
      engine.nextTeam()
      engine.nextTeam() // full lap, but tiebreaker active
      expect(engine.getState().round).toBe(1)
    })
  })

  describe('startGame', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
    })

    it('is not started on a fresh quiz', () => {
      expect(engine.getState().gameStarted).toBe(false)
    })

    it('marks live, finalizes the roster, resets to round 1 at the first team', () => {
      engine.addTeam('A')
      engine.addTeam('B')
      engine.addTeam('C')
      const [a] = engine.getState().teams.map((t) => t.id)
      engine.setTeamOrderLocked(true)
      engine.nextTeam()
      engine.nextTeam() // advance the current team and round bookkeeping
      engine.setTeamOrderLocked(false)

      engine.startGame()
      const s = engine.getState()
      expect(s.gameStarted).toBe(true)
      expect(s.teamOrderLocked).toBe(true)
      expect(s.round).toBe(1)
      expect(s.currentTeamId).toBe(a)
    })

    it('gates nothing — round counting works from round 1 without a manual lock', () => {
      engine.addTeam('A')
      engine.addTeam('B')
      engine.startGame()
      engine.nextTeam() // A -> B
      engine.nextTeam() // B -> A, full lap on the auto-locked roster
      expect(engine.getState().round).toBe(2)
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

  describe('ranking reveal', () => {
    beforeEach(() => {
      engine.loadQuiz('/test.tcq', meta, categories, questionCategoryMap)
    })

    it('clamps reveal to the placement-row count, so a split podium tie is fully revealable', () => {
      engine.addTeam('A')
      engine.addTeam('B')
      engine.addTeam('C')
      const [a, b, c] = engine.getState().teams.map((t) => t.id)
      // A & B tied for 1st on score, resolved by sub-score → 3 placement rows
      // (1st, 2nd, 3rd) even though there are only 2 score tiers.
      engine.updateScore(a, 50)
      engine.updateScore(b, 50)
      engine.updateScore(c, 40)
      engine.updateTiebreakScore(a, 2)
      engine.updateTiebreakScore(b, 1)
      engine.finishQuiz()

      engine.revealNext()
      engine.revealNext()
      engine.revealNext()
      expect(engine.getState().rankingRevealStep).toBe(3)
      engine.revealNext()
      expect(engine.getState().rankingRevealStep).toBe(3)
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

  describe('game screen fullscreen', () => {
    it('starts false and mirrors whatever the main process reports', () => {
      expect(engine.getState().gameScreenFullscreen).toBe(false)
      engine.setGameScreenFullscreen(true)
      expect(engine.getState().gameScreenFullscreen).toBe(true)
      engine.setGameScreenFullscreen(false)
      expect(engine.getState().gameScreenFullscreen).toBe(false)
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
