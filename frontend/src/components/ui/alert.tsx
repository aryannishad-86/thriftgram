import * as React from "react"
import { AlertTriangle, CheckCircle, Info, type LucideIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva("flex items-start gap-3 rounded-xl border p-4 text-sm", {
    variants: {
        variant: {
            error: "border-error/20 bg-error/5 text-error",
            success: "border-success/20 bg-success/5 text-success",
            info: "border-primary/20 bg-primary/5 text-primary",
        },
    },
    defaultVariants: { variant: "info" },
})

const defaultIcons: Record<string, LucideIcon> = {
    error: AlertTriangle,
    success: CheckCircle,
    info: Info,
}

export interface AlertProps extends VariantProps<typeof alertVariants> {
    icon?: LucideIcon
    children: React.ReactNode
    className?: string
}

/** Collapses the 4 error/success banner sites (login/register used raw
 * red-500, profile/edit used the tokens, orders used raw green-*). */
function Alert({ variant = "info", icon, children, className }: AlertProps) {
    const Icon = icon || defaultIcons[variant ?? "info"]
    return (
        <div className={cn(alertVariants({ variant }), className)}>
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="leading-relaxed">{children}</div>
        </div>
    )
}

export { Alert }
