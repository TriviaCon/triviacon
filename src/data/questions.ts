import { Question } from '@renderer/context/categories'
import { db } from './db'

const allByCategoryId = async (categoryId: number): Promise<Question[]> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const questions = await db.all(
    'SELECT id, text, answer, media FROM Questions WHERE categoryId = ?',
    categoryId
  )
  return questions
}

const byId = async (id: number): Promise<Question | null> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const question = await db.get('SELECT id, text, answer, media FROM Questions WHERE id = ?', id)
  return question || null
}

const update = async (id: number, updates: Partial<Question>): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const fields = Object.keys(updates)
  const values = Object.values(updates)

  if (fields.length === 0) {
    throw new Error('No fields to update')
  }

  const setClause = fields.map((field) => `${field} = ?`).join(', ')
  const query = `UPDATE Questions SET ${setClause} WHERE id = ?`

  await db.run(query, ...values, id)
}

const _delete = async (id: number): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  const deleteStmt = await db.prepare('DELETE FROM Questions WHERE id = ?')
  await deleteStmt.run(id)
  await deleteStmt.finalize()
}
export default {
  byId,
  allByCategoryId,
  update,
  delete: _delete
}
