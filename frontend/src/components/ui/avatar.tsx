import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { cloudinaryUrl, isCloudinary } from "@/lib/cloudinary"

const SIZES = {
    sm: { px: 32, cls: "h-8 w-8 text-[0.625rem]" },
    md: { px: 40, cls: "h-10 w-10 text-xs" },
    lg: { px: 48, cls: "h-12 w-12 text-sm" },
    xl: { px: 96, cls: "h-24 w-24 text-xl" },
} as const

export interface AvatarProps {
    src?: string | null
    /** Used for the alt text and to derive the fallback initial. */
    name?: string | null
    size?: keyof typeof SIZES
    className?: string
}

/**
 * Profile image with an initial fallback.
 *
 * Hand-rolled at 6+ call sites, each with its own fallback behaviour — several
 * rendered a broken image or an empty grey disc when `profile_picture` was
 * null, which is the common case in this dataset. One implementation, one
 * fallback.
 *
 * Deliberately still ROUND while the rest of the system went square: a face is
 * the one thing a circle genuinely suits, and keeping it circular makes it
 * read as a person rather than another content tile.
 */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
    const { px, cls } = SIZES[size]
    const initial = (name || "?").trim().charAt(0).toUpperCase()
    // Square crop with face-aware gravity — g_auto finds the subject, which
    // matters far more on a 32px avatar than anywhere else in the app.
    const url = src ? cloudinaryUrl(src, { width: px * 2, aspect: "1:1" }) : ""

    return (
        <span
            className={cn(
                "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-base-2 font-mono uppercase text-muted-foreground",
                cls,
                className
            )}
        >
            {url ? (
                <Image
                    src={url}
                    alt={name || "User avatar"}
                    fill
                    sizes={`${px}px`}
                    unoptimized={isCloudinary(src)}
                    className="object-cover"
                />
            ) : (
                initial
            )}
        </span>
    )
}
