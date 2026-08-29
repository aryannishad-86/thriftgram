import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * The gallery wall label.
 *
 * Sizes, conditions, statuses and counts were hand-rolled at ~15 call sites as
 * one-off `<span className="rounded-full px-2 py-0.5 text-xs …">` variations,
 * each slightly different. This is the single canonical treatment: mono,
 * uppercase, wide-tracked, square — the same voice as Button, so chips and
 * buttons read as one system.
 */
const badgeVariants = cva(
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-none font-mono text-[0.625rem] font-medium uppercase tracking-[0.14em]",
    {
        variants: {
            variant: {
                // Hairline chip — the default. Reads as metadata, not as a control.
                outline: "border border-border text-muted-foreground",
                solid: "bg-ink text-paper",
                accent: "bg-primary text-primary-foreground",
                success: "border border-success/30 bg-success/10 text-success",
                warning: "border border-warning/30 bg-warning/10 text-warning",
                danger: "border border-error/30 bg-error/10 text-error",
                // For chips sitting ON photography, where the ground is unknown.
                onImage: "glass-light text-white",
            },
            size: {
                sm: "h-5 px-1.5",
                md: "h-6 px-2.5",
            },
        },
        defaultVariants: { variant: "outline", size: "md" },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant, size, ...props }, ref) => (
        <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />
    )
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
