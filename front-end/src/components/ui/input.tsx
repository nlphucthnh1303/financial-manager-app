import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onClick, ...props }, ref) => {
    const isDate = type === "date" || type === "datetime-local" || type === "month" || type === "time";

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      onClick?.(e);
      if (isDate) {
        try {
          (e.currentTarget as any).showPicker?.();
        } catch {
          // ignore if not supported
        }
      }
    };

    return (
      <input
        type={type}
        onClick={handleClick}
        className={cn(
          "flex h-9 w-full rounded-md bg-transparent px-3 py-1.5 text-base sm:text-sm shadow-input text-[#171717] dark:text-[#ededed] placeholder:text-[#888888] dark:placeholder:text-[#666666] file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 active:scale-[0.998]",
          isDate && "[&::-webkit-datetime-edit]:flex-1 [&::-webkit-datetime-edit]:inline-flex [&::-webkit-calendar-picker-indicator]:ml-auto cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
