import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Square, hairline-bounded panels. On a dark canvas a card is defined by its
// RULE and a slight lift in surface lightness, not by a shadow — black
// shadows are invisible here (see the elevation note in globals.css). That
// makes the border the load-bearing element, so `interactive` brightens the
// rule on hover rather than deepening a shadow nobody can see.
const cardVariants = cva("rounded-none border border-border bg-card", {
    variants: {
        padding: {
            none: "",
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        },
        interactive: {
            true: "transition-colors duration-200 hover:border-line-strong",
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
