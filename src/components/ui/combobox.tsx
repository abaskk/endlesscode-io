"use client"

import * as React from "react"
import { X } from "lucide-react"

const ComboboxContext = React.createContext<any>(null)

export function useCombobox() {
  const context = React.useContext(ComboboxContext)
  if (!context) throw new Error("useCombobox must be used within Combobox")
  return context
}

export function useComboboxAnchor() {
  return React.useRef<HTMLDivElement>(null)
}

export function Combobox({ children, items, value, onValueChange, multiple, defaultValue }: any) {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState<any[]>(defaultValue || [])
  const [search, setSearch] = React.useState("")

  const activeValue = value !== undefined ? value : internalValue
  const handleChange = onValueChange || setInternalValue

  // Close when clicking outside
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <ComboboxContext.Provider value={{
      value: activeValue,
      onValueChange: handleChange,
      open,
      setOpen,
      items,
      search,
      setSearch,
      multiple
    }}>
      <div ref={containerRef} className="relative w-full">{children}</div>
    </ComboboxContext.Provider>
  )
}

export const ComboboxChips = React.forwardRef<HTMLDivElement, any>(({ className, children, ...props }, ref) => {
  const { setOpen } = useCombobox()
  return (
    <div
      ref={ref}
      className={`flex items-center gap-1.5 px-2 py-1 border border-input rounded-md bg-background h-8 cursor-text overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-shadow ${className || ''}`}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </div>
  )
})
ComboboxChips.displayName = "ComboboxChips"

export function ComboboxValue({ children }: any) {
  const { value } = useCombobox()
  return children(value)
}

export function ComboboxChip({ children, value }: any) {
  const { value: selectedValues, onValueChange } = useCombobox()
  const val = value !== undefined ? value : (typeof children === 'string' ? children : null)
  return (
    <div className="inline-flex items-center rounded bg-accent/50 hover:bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground shrink-0 transition-colors">
      <span className="truncate max-w-[140px]">{children}</span>
      <button
        type="button"
        className="ml-1 rounded-full p-0.5 opacity-70 hover:opacity-100 hover:bg-background/50 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          if (val) onValueChange(selectedValues.filter((x: any) => x !== val))
        }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export const ComboboxChipsInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  const { search, setSearch, setOpen } = useCombobox()
  return (
    <input
      ref={ref}
      value={search}
      onChange={(e) => {
        setSearch(e.target.value)
        setOpen(true)
      }}
      onFocus={() => setOpen(true)}
      className="bg-transparent outline-none text-sm w-[40px] flex-1 h-full placeholder:text-muted-foreground/70"
      placeholder="Filter sections..."
      {...props}
    />
  )
})
ComboboxChipsInput.displayName = "ComboboxChipsInput"

export function ComboboxContent({ children }: any) {
  const { open } = useCombobox()
  if (!open) return null
  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-popover text-popover-foreground shadow-md rounded-md border border-popover max-h-60 overflow-y-auto z-50">
      {children}
    </div>
  )
}

export function ComboboxList({ children }: any) {
  const { items, search } = useCombobox()
  const lowerSearch = search.toLowerCase()
  const filtered = (items || []).filter((item: any) => {
    const label = item.label || item
    return typeof label === 'string' && label.toLowerCase().includes(lowerSearch)
  })

  return <>{filtered.map(children)}</>
}

export function ComboboxEmpty({ children }: any) {
  const { items, search } = useCombobox()
  const lowerSearch = search.toLowerCase()
  const filtered = (items || []).filter((item: any) => {
    const label = item.label || item
    return typeof label === 'string' && label.toLowerCase().includes(lowerSearch)
  })

  if (filtered.length > 0) return null
  return <div className="py-6 text-center text-sm text-muted-foreground">{children}</div>
}

export function ComboboxItem({ children, value }: any) {
  const { value: selectedValues, onValueChange, setOpen, multiple } = useCombobox()

  const isSelected = selectedValues.includes(value)

  return (
    <button
      type="button"
      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between ${isSelected ? 'bg-accent text-accent-foreground' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        if (multiple) {
          onValueChange(isSelected ? selectedValues.filter((x: any) => x !== value) : [...selectedValues, value])
        } else {
          onValueChange([value])
          setOpen(false)
        }
      }}
    >
      <span className="truncate">{children}</span>
    </button>
  )
}
