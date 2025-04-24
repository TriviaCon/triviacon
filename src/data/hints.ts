import { db } from './db'
import { Hint } from '@renderer/types'

// Create a new hint
const create = async (questionId: number, hint: string = ''): Promise<number> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const result = await db.run(
    'INSERT INTO Hints (hint, questionId) VALUES (?, ?)',
    hint,
    questionId
  )
  if (!result.lastID) {
    console.error('No lastID??', result)
    throw new Error('No lastID??')
  }
  return result.lastID // Return the ID of the newly created hint
}

// Read all hints
const all = async (): Promise<Hint[]> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const hints = await db.all('SELECT id, hint, questionId FROM Hints')
  return hints as Hint[]
}

// Read hints by question ID
const byQuestionId = async (questionId: number): Promise<Hint[]> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const hint = await db.all(
    'SELECT id, hint, questionId FROM Hints WHERE questionId = ?',
    questionId
  )
  return hint ?? []
}

// Update an existing hint
const update = async (id: number, hint: string): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  await db.run('UPDATE Hints SET hint = ? WHERE id = ?', hint, id)
}

// Delete a hint
const remove = async (id: number): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  await db.run('DELETE FROM Hints WHERE id = ?', id)
}

export default {
  all,
  byQuestionId,
  create,
  update,
  remove
}
