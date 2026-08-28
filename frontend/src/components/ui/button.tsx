import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// AFTER HOURS: buttons are SQUARE, not pills.
//
// The pill was the single most "generic product UI" element in the old design
// — a gallery/editorial register wants edges. rounded-none across every
// variant; the only circles left in the system are genuinely circular things
// (Avatar, icon-only affordances), which opt in via className.
//
// Labels are set in mono, uppercase, wide-tracked — the museum wall label /
// auction lot voice. This is the detail that makes the UI read as a gallery
// rather than a storefront, and it costs nothing.
const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-mono text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-40",
    {
        variants: {
            variant: {
                // Bone slab — the loud, primary commitment (buy, submit, post).
                primary: "bg-ink text-paper hover:bg-base-02",
                // Acid citron — reserved for the single most wanted action on a
                // view. Deliberately rarer than primary so it keeps its punch.
                secondary: "bg-primary text-primary-foreground hover:bg-primary-hover",
                // Hairline box. The default for anything non-committal; on a
                // dark ground a 1px rule reads better than a filled button.
                outline: "border border-line-strong text-foreground bg-transparent hover:border-primary hover:text-primary",
                ghost: "text-foreground hover:bg-base-2",
                // Not a button shape at all — inline text with a rule under it.
                link: "text-primary underline-offset-4 hover:underline p-0 h-auto normal-case tracking-normal font-sans text-sm",
                danger: "bg-error text-paper hover:bg-error/85",
            },
            size: {
                sm: "h-8 px-4",
                md: "h-11 px-6",
                lg: "h-14 px-10",
                icon: "h-10 w-10 px-0",
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

// Restrained on purpose. The old spring scaled the button up 3% on hover,
// which on a PILL was fine but on a square button visibly softens the corners
// mid-animation and reads as cheap. A square, editorial button should feel
// precise: no scale-up, a 1px lift, and a fast press-down. Colour does most of
// the hover work now (see the variants above).
const tapMotion = {
    whileHover: { y: -1 },
    whileTap: { y: 0, scale: 0.985 },
    transition: { type: "spring" as const, stiffness: 600, damping: 30 },
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
