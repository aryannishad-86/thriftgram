import * as React from "react"
import { WifiOff, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
    /** What failed to load, e.g. "your orders". Used in the default message. */
    subject?: string
    title?: string
    description?: string
    /** Wire this to the page's fetch function to render a Try again button. */
    onRetry?: () => void
    className?: string
}

/**
 * Full-page "we couldn't load this" state, for when a data fetch fails.
 *
 * Distinct from <Alert>, which is an inline banner for form/action errors
 * (a failed login, an invalid field). This is the whole-content-area case:
 * the page has nothing to show because the request didn't come back.
 *
 * It exists because every data-fetching page in the app previously
 * `console.error`'d a failed fetch and then fell through to its EmptyState —
 * so "the backend is down" rendered as "You have no orders yet" / "No items
 * in your wishlist". That's not a cosmetic issue: it actively misinforms
 * (a seller sees an empty shop and concludes their listings vanished), and
 * it hides real outages from the people best positioned to report them.
 * This project has already had one full backend outage where every endpoint
 * 500'd — during it, the app would have looked serenely, incorrectly empty.
 */
function ErrorState({
    subject,
    title = "Couldn't load this",
    description,
    onRetry,
    className,
}: ErrorStateProps) {
    const body =
        description ??
        `Something went wrong loading ${subject ?? "this page"}. This is usually temporary — check your connection and try again.`

    return (
        <div
            role="alert"
            className={cn("flex flex-col items-center justify-center py-20 text-center", className)}
        >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-none border border-error/25 bg-error/10">
                <WifiOff className="h-7 w-7 text-error" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>
            {onRetry && (
                <div className="mt-6">
                    <Button variant="outline" onClick={onRetry}>
                        <RotateCw className="h-4 w-4" />
                        Try again
                    </Button>
                </div>
            )}
        </div>
    )
}

export { ErrorState }
