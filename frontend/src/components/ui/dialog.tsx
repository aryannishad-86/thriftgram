'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
    /** Full-bleed sheet instead of a centred panel (search, filters). */
    variant?: "panel" | "sheet"
}

/**
 * Modal dialog.
 *
 * Hand-rolled at several call sites (SearchBar's full-screen overlay,
 * CartDrawer) with none of the accessibility behaviour a dialog needs. This
 * provides the parts that were consistently missing:
 *
 * - Escape to close, and a click on the backdrop (but not on the panel).
 * - Body scroll lock while open — without it the page behind scrolls under
 *   the overlay, which was the existing behaviour.
 * - Focus is moved into the dialog on open and RESTORED to the trigger on
 *   close, so keyboard users aren't dumped back at the top of the document.
 * - Focus trap: Tab cycles within the dialog instead of walking into the
 *   page behind it.
 * - role="dialog" + aria-modal + a labelled title.
 *
 * Deliberately not a Radix dependency: only @radix-ui/react-slot is installed,
 * and pulling react-dialog for this would add a package where ~70 lines does
 * the job.
 */
export function Dialog({ open, onClose, title, children, className, variant = "panel" }: DialogProps) {
    const panelRef = React.useRef<HTMLDivElement>(null)
    const restoreRef = React.useRef<HTMLElement | null>(null)
    const titleId = React.useId()

    // onClose is virtually always an inline arrow at the call site, so it's a
    // NEW function identity on every render. Depending on it directly made the
    // effect tear down and re-run on every render — and since the teardown
    // restores focus to the trigger, focus was yanked straight back out of the
    // dialog the moment anything re-rendered (and the scroll lock thrashed).
    // Verified in the browser: focus stayed on the trigger button. Hold it in
    // a ref so the effect depends only on `open`.
    const onCloseRef = React.useRef(onClose)
    React.useEffect(() => {
        onCloseRef.current = onClose
    })

    // useLayoutEffect, not useEffect + requestAnimationFrame. The first version
    // polled for a focusable target across a few rAF callbacks on the theory
    // that content (e.g. an input further down the tree) might mount a frame
    // late. Verified in this environment that rAF is an actively bad tool for
    // this: in a backgrounded/throttled tab it can fail to fire at all for
    // seconds, which would leave focus sitting on the trigger indefinitely —
    // exactly the bug this code exists to prevent. useLayoutEffect runs
    // synchronously after the DOM is updated and before the browser paints, so
    // by the time it runs, `children` (already passed in as fully-rendered
    // JSX, not something that mounts later) is already in the DOM. No polling
    // needed — grab focus once, synchronously.
    React.useLayoutEffect(() => {
        if (!open) return

        restoreRef.current = document.activeElement as HTMLElement | null
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCloseRef.current()
                return
            }
            if (e.key !== "Tab" || !panelRef.current) return

            const focusables = panelRef.current.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            )
            if (focusables.length === 0) return
            const first = focusables[0]
            const last = focusables[focusables.length - 1]

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener("keydown", onKeyDown)

        const target =
            panelRef.current?.querySelector<HTMLElement>(
                'input:not([type="hidden"]), textarea, select, button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
            ) ?? panelRef.current
        target?.focus()

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = prevOverflow
            restoreRef.current?.focus?.()
        }
    }, [open])

    if (!open) return null

    return (
        // DELIBERATELY NOT AnimatePresence.
        //
        // The first version animated in and out via AnimatePresence, and in
        // this framer-motion 12 / React 19 combination the exited subtree was
        // observed NOT unmounting: the panel finished animating to opacity 0
        // and then stayed in the DOM as a `fixed inset-0` node with
        // pointer-events:auto — an invisible sheet over the entire viewport
        // that swallows every click on the page after the dialog is opened and
        // closed once. Adding a key and forcing pointerEvents on exit both
        // failed to clear it, because the orphaned subtree was no longer being
        // re-rendered by React at all. Caught by reading computed opacity and
        // hit-testing, not by looking at it — it LOOKED closed.
        //
        // A modal's exit animation is a nice-to-have; a site that silently
        // stops responding to clicks is not. So the exit animation is gone and
        // unmounting is now plain conditional rendering, which cannot fail.
        // The enter animation is kept — it runs on mount, where there is no
        // presence-tracking involved.
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-start justify-center bg-paper/85 p-4 backdrop-blur-sm sm:p-8"
        >
            <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                aria-labelledby={title ? titleId : undefined}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "relative w-full border border-border bg-card",
                    variant === "sheet" ? "max-w-3xl mt-[10vh]" : "max-w-lg mt-[15vh] p-6",
                    className
                )}
            >
                {title && (
                    <div className="mb-4 flex items-center justify-between">
                        <h2 id={titleId} className="label-meta text-foreground">{title}</h2>
                    </div>
                )}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="absolute right-3 top-3 p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="h-4 w-4" />
                </button>
                {children}
            </motion.div>
        </motion.div>
    )
}
