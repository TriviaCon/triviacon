import { useTranslation } from 'react-i18next'
import type { Category } from '@shared/types/quiz'
import { useSquareGrid } from '../hooks/useSquareGrid'

const TILE_PADDING = 12

/** Estimate font size that fits the name inside the tile. */
function categoryFontSize(tileSize: number, name: string): number {
  const innerWidth = tileSize - TILE_PADDING * 2
  const maxFont = innerWidth * 0.16
  const minFont = innerWidth * 0.08
  // Rough heuristic: estimate chars per line at max font, then shrink if too many lines
  const charsPerLine = innerWidth / (maxFont * 0.6)
  const lines = Math.ceil(name.length / charsPerLine)
  const maxLines = 4
  if (lines <= maxLines) return maxFont
  const scaled = maxFont * (maxLines / lines)
  return Math.max(scaled, minFont)
}

const CategoriesScreen = ({
  categories,
  usedQuestions,
  questionCategoryMap,
  selectedCategoryId
}: {
  categories: Category[]
  usedQuestions: number[]
  questionCategoryMap: Record<number, number>
  selectedCategoryId: number | null
}) => {
  const { t } = useTranslation()
  const { containerRef, cols, tileSize } = useSquareGrid(categories.length)

  const usedByCategory = new Map<number, number>()
  for (const qId of usedQuestions) {
    const catId = questionCategoryMap[qId]
    if (catId !== undefined) {
      usedByCategory.set(catId, (usedByCategory.get(catId) ?? 0) + 1)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="text-center py-4 shrink-0">
        <h1 className="text-5xl font-bold">{t('gameScreen.categories')}</h1>
        <hr className="border-border mt-3 mx-6" />
      </div>
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center px-6 pb-6"
      >
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {t('gameScreen.noCategories')}
          </div>
        ) : (
          <div
            className="grid justify-center content-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
              gap: '12px'
            }}
          >
            {categories.map((category) => {
              const used = usedByCategory.get(category.id) ?? 0
              const remaining = category.questionCount - used
              const exhausted = category.questionCount > 0 && remaining === 0
              const selected = category.id === selectedCategoryId
              const fontSize = categoryFontSize(tileSize, category.name)
              return (
                <div
                  key={category.id}
                  className={`rounded-lg border flex flex-col items-center justify-center text-center overflow-hidden transition-all ${
                    exhausted
                      ? 'border-border/30 bg-muted/20 opacity-40'
                      : selected
                        ? 'border-primary bg-primary/15 ring-2 ring-primary/40'
                        : 'border-border bg-card'
                  }`}
                  style={{ width: tileSize, height: tileSize }}
                >
                  <span
                    className="font-bold text-card-foreground leading-tight break-words"
                    style={{ fontSize, padding: `0 ${TILE_PADDING}px` }}
                  >
                    {category.name}
                  </span>
                  <span
                    className="text-muted-foreground mt-1"
                    style={{ fontSize: tileSize * 0.08 }}
                  >
                    {remaining}/{category.questionCount}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoriesScreen
