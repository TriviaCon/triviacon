import { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Category } from '@shared/types/quiz'
import { useAddCategoryMutation } from '@renderer/hooks/useAddCategoryMutation'
import QuizTreeItem from './QuizTreeItem'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@renderer/components/ui/accordion'

const AddCategoryForm = () => {
  const { t } = useTranslation()
  const mutation = useAddCategoryMutation()
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    await mutation.mutateAsync(data.get('name') as string)
    form.reset()
  }
  return (
    <form className="flex gap-2 mb-2" onSubmit={handleSubmit}>
      <Input type="text" name="name" placeholder={t('builder.addCategory')} readOnly={mutation.isPending} />
      <Button type="submit" disabled={mutation.isPending}>
        {t('actions.add')}
      </Button>
    </form>
  )
}

type QuizTreeProps = {
  categories: Category[]
  setSelectedCategory: (id: number | null) => void
  setSelectedQuestion: (id: number | null) => void
  editable: boolean
  usedQuestions?: number[]
}

const QuizTree: React.FC<QuizTreeProps> = ({
  categories,
  setSelectedCategory,
  setSelectedQuestion,
  editable,
  usedQuestions
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      <h3 className="text-base font-semibold mb-2">{t('actions.categories')} ({categories.length})</h3>
      {editable && <AddCategoryForm />}
      <Accordion type="single" collapsible className="mr-1 overflow-auto">
        {categories.map((category) => (
          <QuizTreeItem
            key={category.id}
            category={category}
            onOpen={() => {
              setSelectedCategory(category.id)
              setSelectedQuestion(null)
            }}
            onSelectQuestion={(id) => setSelectedQuestion(id)}
            onClose={() => {
              setSelectedCategory(null)
              setSelectedQuestion(null)
            }}
            editable={editable}
            usedQuestions={usedQuestions}
          />
        ))}
        {categories.length === 0 && (
          <AccordionItem value="empty">
            <AccordionTrigger>{t('builder.noCategories')}</AccordionTrigger>
            <AccordionContent>{t('builder.noCategoriesHint')}</AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}

export default QuizTree
