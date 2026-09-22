import * as React from "react"

/** Inline validation message shown under a form field. */
export const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p role="alert" className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{message}</p> : null
