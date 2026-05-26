import { useTranslation } from 'react-i18next'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, Underline } from 'lucide-react'
import { Toggle } from '@renderer/components/ui/toggle'
import { cn } from '@renderer/lib/utils'

type RichTextEditorProps = {
  /** Initial HTML. The field is keyed by the caller (per question/option),
   *  so a changing `value` for the same instance is the user's own typing. */
  value: string
  onChange: (html: string) => void
  ariaLabel?: string
  className?: string
}

/**
 * Minimal WYSIWYG editor — bold / italic / underline only.
 *
 * StarterKit is trimmed to just those marks (every block/list/code/link
 * node disabled), so the editor can't produce anything outside the
 * RichText sanitiser's allow-list in the first place.
 */
export function RichTextEditor({
  value,
  onChange,
  ariaLabel,
  className
}: RichTextEditorProps) {
  const { t } = useTranslation()

  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false
      })
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? '',
        class: 'outline-none min-h-[2.25rem] px-3 py-1.5 [&_p]:m-0 [&_p+p]:mt-2'
      }
    }
  })

  if (!editor) return null

  return (
    <div
      className={cn(
        'rounded-md border border-input bg-transparent text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        className
      )}
    >
      <div className="flex gap-0.5 border-b border-border px-1 py-0.5">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label={t('builder.bold')}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label={t('builder.italic')}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label={t('builder.underline')}
        >
          <Underline className="h-4 w-4" />
        </Toggle>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
