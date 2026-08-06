import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
    /** "lg" for hero-style centered pages (leaderboard, drops); "md" for
     * standard list pages (dashboard, orders, wishlist). */
    size?: "md" | "lg"
    align?: "left" | "center"
}

function PageHeader({ title, description, action, className, size = "md", align = "left" }: PageHeaderProps) {
    const titleSize = size === "lg" ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl"
    const titleClass = cn("font-display font-semibold text-foreground", titleSize)

    if (align === "center") {
        return (
            <div className={cn("mb-12 text-center", className)}>
                <h1 className={titleClass}>{title}</h1>
                {description && <p className="mt-3 text-lg text-muted">{description}</p>}
                {action && <div className="mt-6 flex justify-center">{action}</div>}
            </div>
        )
    }

    return (
        <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
            <div>
                <h1 className={titleClass}>{title}</h1>
                {description && <p className="mt-2 text-muted">{description}</p>}
            </div>
            {action}
        </div>
    )
}

export { PageHeader }
