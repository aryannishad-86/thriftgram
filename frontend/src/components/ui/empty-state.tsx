import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

/** Collapses the 6 empty-state sites (feed, wishlist, orders, closet,
 * messages, drops) which previously used 3 different shapes. */
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-20 text-center", className)}>
            {Icon && (
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-base-2">
                    <Icon className="h-7 w-7 text-muted" strokeWidth={1.5} />
                </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    )
}

export { EmptyState }
