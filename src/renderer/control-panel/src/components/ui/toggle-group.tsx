import * as React from 'react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

import { cn } from '@renderer/lib/utils'

/**
 * Segmented control. Wraps radix ToggleGroup.
 * Use `type="single"` for a mutually-exclusive segmented selector.
 */
function ToggleGroup({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        'inline-flex w-full rounded-md border border-input bg-transparent p-0.5',
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        'flex-1 rounded-sm px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors outline-none',
        'hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
