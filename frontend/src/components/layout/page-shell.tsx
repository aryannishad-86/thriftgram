import * as React from "react"
import { cn } from "@/lib/utils"

const maxWidthMap = {
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "6xl": "max-w-6xl",
    full: "",
} as const

export interface PageShellProps {
    children: React.ReactNode
    maxWidth?: keyof typeof maxWidthMap
    className?: string
    /** Skip the default top/side padding — for pages composing their own
     * full-bleed hero (e.g. the home page) before an inner container. */
    noPadding?: boolean
}

/**
 * The single <main> landmark for a page. layout.tsx no longer renders its
 * own <main> — every page previously nested a second <main> inside it
 * (invalid document structure, confusing to screen readers). This also
 * collapses 4 competing shell variants and 5 arbitrary max-widths into one
 * component with one prop.
 */
function PageShell({ children, maxWidth = "6xl", className, noPadding = false }: PageShellProps) {
    return (
        <main className={cn("min-h-screen bg-background", !noPadding && "px-4 pt-24 pb-12", className)}>
            <div className={cn("mx-auto", maxWidthMap[maxWidth])}>{children}</div>
        </main>
    )
}

export { PageShell }
