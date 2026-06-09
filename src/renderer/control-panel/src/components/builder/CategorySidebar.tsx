import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import keys from '@renderer/utils/keys'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical, Pencil, Plus, Shuffle, Trash2, X } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { cn } from '@renderer/lib/utils'
import { useAddCategoryMutation } from '@renderer/hooks/useAddCategoryMutation'
import { useDeleteCategoryMutation } from '@renderer/hooks/useDeleteCategoryMutation'
import type { Category } from '@shared/types/quiz'

// ── Delete confirmation dialog ──────────────────────────────────

function DeleteCategoryDialog({
  open,
  category,
  onOpenChange,
  onConfirm
}: {
  open: boolean
  category: Category
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('builder.deleteCategory')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {category.questionCount > 0
            ? t('builder.deleteCategoryWarning', { name: category.name, count: category.questionCount })
            : t('builder.deleteCategoryEmpty', { name: category.name })}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('actions.cancel')}</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>
            {t('actions.delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sortable category item ──────────────────────────────────────

function CategoryItem({
  category,
  isActive,
  onSelect,
  onDeleted
}: {
  category: Category
  isActive: boolean
  onSelect: () => void
  onDeleted: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(category.name)
  const [showDelete, setShowDelete] = useState(false)
  const deleteMutation = useDeleteCategoryMutation(category.id)
  const qc = useQueryClient()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `category:${category.id}`
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  function commitRename() {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== category.name) window.api.categoryUpdate(category.id, trimmed)
    setEditing(false)
  }

  function cancelRename() {
    setEditValue(category.name)
    setEditing(false)
  }

  function handleDelete() {
    deleteMutation.mutate(undefined, { onSuccess: onDeleted })
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'group relative flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors select-none',
          isActive && 'bg-primary text-primary-foreground',
          !isActive && 'hover:bg-accent',
          isDragging && 'opacity-40'
        )}
        onClick={() => !editing && onSelect()}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab opacity-30 group-hover:opacity-60 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {editing ? (
          <div className="flex items-center gap-1 flex-1" onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              className="h-6 text-xs py-0 px-1"
            />
            <button onClick={commitRename} className="text-green-600 hover:text-green-700 shrink-0">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={cancelRename} className="text-destructive hover:text-destructive/80 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="flex-1 truncate">{category.name}</span>
        )}

        <span className={cn('text-xs shrink-0 tabular-nums', isActive ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {category.questionCount}
        </span>

        {!editing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setEditValue(category.name); setEditing(true) }}
              className={cn('p-0.5 rounded hover:bg-black/10', isActive && 'hover:bg-white/20')}
              title="Rename"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={async () => {
                await window.api.categoryShuffle(category.id)
                qc.invalidateQueries({ queryKey: keys.questions(category.id) })
              }}
              className={cn('p-0.5 rounded hover:bg-black/10', isActive && 'hover:bg-white/20')}
              title="Shuffle questions"
            >
              <Shuffle className="h-3 w-3" />
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className={cn('p-0.5 rounded hover:bg-destructive/20 text-destructive', isActive && 'text-red-300')}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <DeleteCategoryDialog
        open={showDelete}
        category={category}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
      />
    </>
  )
}

// ── Sidebar ────────────────────────────────────────────────────

interface CategorySidebarProps {
  categories: Category[]
  selectedCategoryId: number | null
  onSelect: (id: number | null) => void
  onDeleted: () => void
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelect,
  onDeleted,
}: CategorySidebarProps) {
  const { t } = useTranslation()
  const addCategory = useAddCategoryMutation()
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')

  function commitAdd() {
    const trimmed = newName.trim()
    if (trimmed) addCategory.mutate(trimmed)
    setNewName('')
    setAddingNew(false)
  }

  const sortableIds = categories.map((c) => `category:${c.id}`)

  return (
    <aside className="w-56 shrink-0 border-r border-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('actions.categories')}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddingNew(true)} title={t('builder.addCategory')}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {categories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              isActive={selectedCategoryId === cat.id}
              onSelect={() => onSelect(cat.id)}
              onDeleted={() => {
                if (selectedCategoryId === cat.id) onSelect(null)
                onDeleted()
              }}
            />
          ))}
        </SortableContext>

        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-3">{t('builder.noCategories')}</p>
        )}

        {addingNew && (
          <div className="flex items-center gap-1 px-2 py-1">
            <Input
              autoFocus
              placeholder={t('builder.addCategory')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAdd()
                if (e.key === 'Escape') { setAddingNew(false); setNewName('') }
              }}
              className="h-6 text-xs py-0 px-1"
            />
            <button onClick={commitAdd} className="text-green-600 shrink-0"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => { setAddingNew(false); setNewName('') }} className="text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
    </aside>
  )
}
