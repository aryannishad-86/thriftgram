import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            // bg-white/10 was invisible on the light canvas — every caller had
            // to override it (3 of 4 did; the 4th, drops/page.tsx, didn't and
            // rendered an invisible skeleton). base-2 is visible by default.
            className={cn("animate-pulse rounded-md bg-base-2", className)}
            {...props}
        />
    )
}

export { Skeleton }
