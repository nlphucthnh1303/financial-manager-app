import * as React from "react"
import { Input } from "@/components/ui/input"

type MoneyInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** Raw digit string, e.g. "1500000" */
  value: string
  onValueChange: (raw: string) => void
}

// 999.999.999.999 — matches MAX_AMOUNT in lib/validation
const MAX_DIGITS = 12

const formatThousands = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

/** Money input that displays VND with dot thousand separators (1.500.000) while keeping the raw digits in state. */
const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    const caretDigits = React.useRef<number | null>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    const display = formatThousands(value)

    // Keep the caret after the same number of digits once the dots are re-inserted
    React.useLayoutEffect(() => {
      const el = innerRef.current
      if (!el || caretDigits.current === null || document.activeElement !== el) return
      let pos = 0
      let seen = 0
      while (pos < display.length && seen < caretDigits.current) {
        if (/\d/.test(display[pos])) seen++
        pos++
      }
      el.setSelectionRange(pos, pos)
      caretDigits.current = null
    }, [display])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value: input, selectionStart } = e.target
      caretDigits.current = input.slice(0, selectionStart ?? input.length).replace(/\D/g, "").length
      onValueChange(input.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS))
    }

    return (
      <Input
        {...props}
        ref={innerRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
      />
    )
  }
)
MoneyInput.displayName = "MoneyInput"

export { MoneyInput }
