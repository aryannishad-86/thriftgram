import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldProps {
    label?: string
    htmlFor?: string
    error?: string
    helper?: string
    required?: boolean
    className?: string
    children: React.ReactNode
}

/**
 * One wrapper for label + control + error/helper. Composes Input, Textarea,
 * Select, or any custom control as children — collapses the 5 competing
 * hand-rolled form idioms (sell, register, login's floating labels,
 * profile/edit, AdvancedFilters/ReviewForm/MessageInput) into one pattern.
 */
function Field({ label, htmlFor, error, helper, required, className, children }: FieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
                    {label}
                    {required && <span className="ml-0.5 text-error">*</span>}
                </label>
            )}
            {children}
            {error ? (
                <p className="text-sm text-error">{error}</p>
            ) : helper ? (
                <p className="text-sm text-muted">{helper}</p>
            ) : null}
        </div>
    )
}

export { Field }
