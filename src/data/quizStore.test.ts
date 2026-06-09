import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyDocument,
  setDocument,
  categoryCreate,
  categoriesAll,
  categoriesReorder,
  shuffleCategory,
  questionCreate,
  questionsAllByCategoryId,
  questionsReorder,
  questionsBulkMove,
} from './quizStore'

function setup() {
  setDocument(createEmptyDocument())
}

describe('category sortOrder', () => {
  beforeEach(setup)

  it('assigns ascending sortOrder on creation', () => {
    categoryCreate('A')
    categoryCreate('B')
    categoryCreate('C')
    const cats = categoriesAll()
    expect(cats.map((c) => c.name)).toEqual(['A', 'B', 'C'])
    expect(cats.map((c) => c.sortOrder)).toEqual([0, 1, 2])
  })

  it('categoriesReorder updates sortOrder and reflects new order', () => {
    const a = categoryCreate('A')
    const b = categoryCreate('B')
    const c = categoryCreate('C')
    categoriesReorder([c, a, b])
    const cats = categoriesAll()
    expect(cats.map((cat) => cat.name)).toEqual(['C', 'A', 'B'])
  })
})

describe('shuffleCategory', () => {
  beforeEach(setup)

  it('changes the order of questions within the category', () => {
    const catId = categoryCreate('Science')
    for (let i = 0; i < 10; i++) {
      questionCreate({ categoryId: catId, type: 'single-answer', text: `Q${i}`, media: null })
    }
    const before = questionsAllByCategoryId(catId).map((q) => q.id)
    // Shuffle until order changes (probabilistic — 10! possibilities, chance of same order is negligible)
    let changed = false
    for (let attempt = 0; attempt < 20; attempt++) {
      shuffleCategory(catId)
      const after = questionsAllByCategoryId(catId).map((q) => q.id)
      if (before.some((id, i) => after[i] !== id)) { changed = true; break }
    }
    expect(changed).toBe(true)
  })

  it('does not change the set of questions, only their order', () => {
    const catId = categoryCreate('History')
    const ids = [
      questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q1', media: null }),
      questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q2', media: null }),
      questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q3', media: null }),
    ]
    shuffleCategory(catId)
    const after = questionsAllByCategoryId(catId).map((q) => q.id).sort()
    expect(after).toEqual(ids.sort())
  })

  it('does not affect questions in other categories', () => {
    const cat1 = categoryCreate('Cat1')
    const cat2 = categoryCreate('Cat2')
    questionCreate({ categoryId: cat2, type: 'single-answer', text: 'Other', media: null })
    const q1 = questionCreate({ categoryId: cat1, type: 'single-answer', text: 'Q1', media: null })
    shuffleCategory(cat1)
    const cat2Questions = questionsAllByCategoryId(cat2)
    expect(cat2Questions).toHaveLength(1)
    const cat1Questions = questionsAllByCategoryId(cat1)
    expect(cat1Questions.map((q) => q.id)).toContain(q1)
  })
})

describe('question sortOrder', () => {
  beforeEach(setup)

  it('assigns ascending sortOrder within the category on creation', () => {
    const catId = categoryCreate('Science')
    questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q1', media: null })
    questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q2', media: null })
    questionCreate({ categoryId: catId, type: 'single-answer', text: 'Q3', media: null })
    const qs = questionsAllByCategoryId(catId)
    expect(qs.map((q) => q.text)).toEqual(['Q1', 'Q2', 'Q3'])
    expect(qs.map((q) => q.sortOrder)).toEqual([0, 1, 2])
  })

  it('questionsReorder updates sortOrder and reflects new order', () => {
    const catId = categoryCreate('History')
    const a = questionCreate({ categoryId: catId, type: 'single-answer', text: 'A', media: null })
    const b = questionCreate({ categoryId: catId, type: 'single-answer', text: 'B', media: null })
    const c = questionCreate({ categoryId: catId, type: 'single-answer', text: 'C', media: null })
    questionsReorder([c, a, b])
    const qs = questionsAllByCategoryId(catId)
    expect(qs.map((q) => q.text)).toEqual(['C', 'A', 'B'])
  })
})

describe('questionsBulkMove', () => {
  beforeEach(setup)

  it('moves questions to target category', () => {
    const src = categoryCreate('Source')
    const dst = categoryCreate('Dest')
    const q1 = questionCreate({ categoryId: src, type: 'single-answer', text: 'Q1', media: null })
    const q2 = questionCreate({ categoryId: src, type: 'single-answer', text: 'Q2', media: null })
    questionCreate({ categoryId: src, type: 'single-answer', text: 'Q3', media: null })
    questionsBulkMove([q1, q2], dst)
    const srcRemaining = questionsAllByCategoryId(src)
    expect(srcRemaining).toHaveLength(1)
    expect(srcRemaining[0].text).toBe('Q3')
    const dstQuestions = questionsAllByCategoryId(dst)
    expect(dstQuestions).toHaveLength(2)
    expect(dstQuestions.map((q) => q.text).sort()).toEqual(['Q1', 'Q2'])
  })

  it('appends moved questions after existing ones in target', () => {
    const src = categoryCreate('Source')
    const dst = categoryCreate('Dest')
    const existing = questionCreate({ categoryId: dst, type: 'single-answer', text: 'Existing', media: null })
    const q1 = questionCreate({ categoryId: src, type: 'single-answer', text: 'Moved', media: null })
    questionsBulkMove([q1], dst)
    const dstQuestions = questionsAllByCategoryId(dst)
    expect(dstQuestions[0].id).toBe(existing)
    expect(dstQuestions[1].id).toBe(q1)
  })
})

describe('setDocument backfill', () => {
  it('backfills sortOrder=0 for categories missing it', () => {
    const raw = createEmptyDocument()
    // Simulate old document without sortOrder
    ;(raw.categories as unknown as Array<{ id: number; name: string }>).push(
      { id: 1, name: 'Old Cat A' },
      { id: 2, name: 'Old Cat B' }
    )
    setDocument(raw)
    const cats = categoriesAll()
    expect(cats.every((c) => typeof c.sortOrder === 'number')).toBe(true)
  })

  it('backfills sortOrder for questions missing it', () => {
    const raw = createEmptyDocument()
    ;(raw.categories as unknown as Array<{ id: number; name: string }>).push({ id: 1, name: 'Cat' })
    ;(raw.questions as unknown as Array<{ id: number; categoryId: number; type: string; text: string; media: null }>).push(
      { id: 1, categoryId: 1, type: 'single-answer', text: 'Q1', media: null },
      { id: 2, categoryId: 1, type: 'single-answer', text: 'Q2', media: null }
    )
    setDocument(raw)
    const qs = questionsAllByCategoryId(1)
    expect(qs.every((q) => typeof q.sortOrder === 'number')).toBe(true)
  })
})
