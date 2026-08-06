import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// rounded-2xl is the one canonical card radius — replaces the previous
// 2xl/3xl/xl mix used interchangeably for the same class of surface.
const cardVariants = cva("rounded-2xl border border-border bg-card", {
    variants: {
        padding: {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        },
        interactive: {
            true: "transition-shadow duration-200 hover:shadow-md",
            false: "",
        },
    },
    defaultVariants: { padding: "md", interactive: false },
})

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> { }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, padding, interactive, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(cardVariants({ padding, interactive }), className)}
            {...props}
        />
    )
)
Card.displayName = "Card"

export { Card, cardVariants }
