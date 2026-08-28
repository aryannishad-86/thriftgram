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
                orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
                "bg-border",
                className
            )}
            {...props}
        />
    )
}
