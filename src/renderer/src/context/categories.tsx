import { createContext, useEffect, useState } from 'react'
import { Category } from '@renderer/types'
import { ipc } from '@renderer/main'

export type CategoriesContextType = {
  addCategory: (name: string) => Promise<unknown>
  deleteCategory: (id: number) => Promise<unknown>
  updateCategory: (id: number, category: Partial<Category>) => void
  addQuestion: (id: number) => void

  categories: Category[]
}

export const CATEGORIES_CONTEXT = createContext<CategoriesContextType>(null!)

export const CategoriesProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const query = async () => {
      await ipc.db.open('mocks/mockQuiz.tcq')
      setCategories(await ipc.db.categories.all())
    }
    query()
  }, [])

  const addCategory = async (name: string) => {
    const id = await ipc.db.categories.create(name)
    setCategories([...categories, { id, name }])
  }

  const addQuestion = (id: number) => {}

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    await ipc.db.categories.update(id, updates.name!)
  }

  const deleteCategory = async (id: number) => {
    await ipc.db.categories.remove(id)
  }

  return (
    <CATEGORIES_CONTEXT.Provider
      value={{
        addCategory: addCategory,
        deleteCategory: deleteCategory,
        updateCategory: updateCategory,
        addQuestion: addQuestion,
        categories
      }}
    >
      {children}
    </CATEGORIES_CONTEXT.Provider>
  )
}
