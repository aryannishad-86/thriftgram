import * as React from "react"
import { cn } from "@/lib/utils"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
    orientation?: "horizontal" | "vertical"
    /** Optional centred label sitting in the rule — an editorial section break. */
    label?: string
}

/**
 * The editorial hairline.
 *
 * A magazine's structure is carried by rules, and on a dark canvas the rule is
 * doing the job a shadow would do on a light one. `label` renders the
 * broken-rule-with-caption form used for section breaks ("OR CONTINUE WITH",
 * "MORE FROM THIS SELLER"), which was hand-built with flex + two bordered divs
 * in several places.
 */
export function Separator({
    className,
    orientation = "horizontal",
    label,
    ...props
}: SeparatorProps) {
    if (label) {
        return (
            <div className={cn("flex items-center gap-4", className)} {...props}>
                <span className="h-px flex-1 bg-border" />
                <span className="label-meta shrink-0">{label}</span>
                <span className="h-px flex-1 bg-border" />
            </div>
        )
    }

    return (
        <div
            role="separator"
            aria-orientation={orientation}
            className={cn(
                // w-full, not just "h-px" — a block div is already 100% wide
                // by default, but explicit width:100% (unlike auto) does NOT
                // subtract margin from that width. Every call site passes a
                // margin className (mx-6, mb-16, ...), so w-full + margin was
                // overflowing its container by exactly 2x the margin — real,
                // measured: a 375px-viewport page's scrollWidth was 399px
                // because of this. Plain block auto-width correctly nets out
                // the margin instead.
                orientation === "horizontal" ? "h-px" : "h-full w-px",
                "bg-border",
                className
            )}
            {...props}
        />
    )
}
