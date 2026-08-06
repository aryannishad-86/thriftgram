import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// One button radius everywhere (rounded-full) — the previous base rounded-xl
// vs. per-caller rounded-full override was exactly the "two systems on one
// page" problem this redesign exists to fix. Settle on one shape.
const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                primary: "bg-ink text-white hover:bg-ink/90",
                secondary: "bg-primary text-primary-foreground hover:bg-primary-hover",
                outline: "border border-ink/30 text-ink bg-transparent hover:border-ink hover:bg-ink hover:text-white",
                ghost: "text-ink hover:bg-base-2",
                link: "text-ink underline-offset-4 hover:underline rounded-none p-0 h-auto font-medium",
                danger: "bg-error text-white hover:bg-error/90",
            },
            size: {
                sm: "h-9 px-4 text-sm",
                md: "h-11 px-6 text-sm",
                lg: "h-14 px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: { variant: "primary", size: "md" },
    }
)

// Both the plain <button> and the asChild <Slot> get the SAME hover/tap
// spring — motion.create(Component) makes any ref-forwarding, single-child
// component motion-capable. This replaces the old motion.div wrapper, which
// silently dropped the animation whenever asChild was set (every <Link>
// button in the app).
const MotionButton = motion.create("button")
const MotionSlot = motion.create(Slot)

const tapMotion = {
    whileHover: { scale: 1.03, y: -1 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
}

// framer-motion's motion.create() props (onDrag, onAnimationStart, etc.) clash
// with the native HTML event handlers of the same name but different
// signatures — omit the native ones so the motion versions win.
type NativeConflicts = "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, NativeConflicts>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
        const classes = cn(buttonVariants({ variant, size }), className)

        if (asChild) {
            return (
                <MotionSlot ref={ref} className={classes} {...tapMotion} {...props}>
                    {children}
                </MotionSlot>
            )
        }

        return (
            <MotionButton
                ref={ref}
                className={classes}
                disabled={disabled || loading}
                {...tapMotion}
                {...props}
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </MotionButton>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
