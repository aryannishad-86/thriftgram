'use client'

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TabItem<T extends string = string> {
    value: T
    label: string
    /** Optional trailing count, rendered in mono. */
    count?: number
}

export interface TabsProps<T extends string = string> {
    items: readonly TabItem<T>[]
    value: T
    onChange: (value: T) => void
    className?: string
    /** Unique per mounted Tabs instance — see the layoutId note below. */
    layoutId?: string
}

/**
 * Underlined tab bar with a sliding indicator.
 *
 * Generalised from the hand-rolled version in /orders. Two things it fixes
 * beyond styling:
 *
 * 1. `layoutId` is now a prop with a unique default. framer-motion matches
 *    shared-layout animations GLOBALLY by that string, so two tab bars mounted
 *    at once — a real possibility once more pages get tabs — would animate
 *    into each other. The old hard-coded "activeTab" made that a latent bug.
 * 2. Real tab semantics (role=tablist/tab, aria-selected), which the hand-rolled
 *    buttons had none of.
 *
 * The indicator is citron: tabs are one of the few places a persistent accent
 * earns its place, because it marks "where you are".
 */
export function Tabs<T extends string = string>({
    items,
    value,
    onChange,
    className,
    layoutId,
}: TabsProps<T>) {
    const reactId = React.useId()
    const indicatorId = layoutId ?? `tabs-indicator-${reactId}`

    return (
        <div role="tablist" className={cn("flex gap-8 border-b border-border", className)}>
            {items.map((item) => {
                const active = item.value === value
                return (
                    <button
                        key={item.value}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => onChange(item.value)}
                        className={cn(
                            "relative -mb-px pb-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                            active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {item.label}
                        {typeof item.count === "number" && (
                            <span className="ml-2 text-muted">{item.count}</span>
                        )}
                        {active && (
                            <motion.span
                                layoutId={indicatorId}
                                className="absolute -bottom-px left-0 right-0 h-px bg-primary"
                                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                        )}
                    </button>
                )
            })}
        </div>
    )
}
