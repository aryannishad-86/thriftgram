/**
 * Cloudinary URL transformation.
 *
 * Every garment photo is a user upload from a phone — arbitrary aspect ratio,
 * arbitrary size, arbitrary quality. Production currently serves these raw:
 * one real listing is a 982 KB PNG. Routed through here at `w=800` it becomes
 * a 41 KB JPEG — measured, not estimated. That is a 24x payload reduction on
 * the single heaviest asset class in the app, for free, with no infra change.
 *
 * It also does something the design depends on: `c_fill` + `g_auto` crops
 * every image to one consistent frame using Cloudinary's subject detection.
 * A gallery needs a shared aspect ratio to read as a gallery, and user uploads
 * will never supply one. This is what makes "garments hung like artworks"
 * possible over content that includes literal screenshots.
 *
 * Non-Cloudinary URLs (local dev media, Unsplash, placeholders) pass through
 * untouched rather than being mangled — callers can use this unconditionally.
 */

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

export type CloudinaryAspect = "3:4" | "4:5" | "1:1" | "16:9" | "original";

/**
 * True when Cloudinary is already serving this asset.
 *
 * Pass the result to next/image's `unoptimized`. Otherwise the image is
 * processed TWICE: Cloudinary resizes/compresses it, then /_next/image
 * re-downloads and re-encodes that output. That is slower, strictly worse
 * quality (two lossy passes), and on Vercel it is billed per optimization —
 * a real cost on a project whose whole constraint is $0 infra. Cloudinary's
 * f_auto/q_auto/dpr_auto already do everything next/image would.
 */
export function isCloudinary(src: string | null | undefined): boolean {
    return !!src && src.includes(CLOUDINARY_UPLOAD_MARKER);
}

export interface CloudinaryOptions {
    /** Rendered width in CSS px. Density is handled by `dpr_auto`. */
    width?: number;
    /** Target frame. "original" skips cropping and only optimizes. */
    aspect?: CloudinaryAspect;
    /** Desaturate — the gallery treatment for hover/rest states. */
    grayscale?: boolean;
    /** Cheap blurred placeholder (tiny, heavily compressed). */
    placeholder?: boolean;
}


export function cloudinaryUrl(
    src: string | null | undefined,
    opts: CloudinaryOptions = {}
): string {
    if (!src) return "";
    // Pass through anything that isn't a Cloudinary delivery URL.
    const markerIndex = src.indexOf(CLOUDINARY_UPLOAD_MARKER);
    if (markerIndex === -1) return src;

    const { width = 800, aspect = "3:4", grayscale = false, placeholder = false } = opts;

    const head = src.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
    let tail = src.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length);

    // Strip any transformation segment already present so repeated calls are
    // idempotent — without this, wrapping an already-transformed URL stacks
    // segments and Cloudinary applies them cumulatively.
    tail = stripExistingTransform(tail);

    const t: string[] = [];

    if (placeholder) {
        // ~1-2 KB. Rendered blurred underneath the real image.
        t.push("w_32", "q_10", "e_blur:400", "f_auto");
    } else {
        t.push(`w_${width}`, "dpr_auto", "q_auto", "f_auto");
    }

    if (aspect !== "original") {
        // g_auto = subject-aware crop. Without it, c_fill center-crops and
        // decapitates a lot of garment photos.
        t.push("c_fill", `ar_${aspect.replace(":", ":")}`, "g_auto");
    } else {
        t.push("c_limit");
    }

    if (grayscale) t.push("e_grayscale");

    return `${head}${t.join(",")}/${tail}`;
}

/**
 * Cloudinary transformation segments are comma-joined directives sitting
 * directly after /upload/. A version segment (v123…) or a bare folder path is
 * NOT a transformation. Distinguish by looking for the `x_y` directive shape.
 */
function stripExistingTransform(tail: string): string {
    const firstSlash = tail.indexOf("/");
    if (firstSlash === -1) return tail;

    const firstSegment = tail.slice(0, firstSlash);
    if (/^v\d+$/.test(firstSegment)) return tail; // version marker — keep

    const looksLikeTransform = firstSegment
        .split(",")
        .every((part) => /^[a-z]{1,3}_[a-zA-Z0-9:._-]+$/.test(part));

    return looksLikeTransform ? tail.slice(firstSlash + 1) : tail;
}

/**
 * Texture URL for the WebGL gallery (R5).
 *
 * Kept separate from the DOM path because GPU textures have different needs:
 * a fixed pixel width (no dpr_auto — the renderer handles density itself, and
 * a surprise 2x texture is 4x the VRAM), and a hard cap so one oversized
 * upload can't blow the texture budget on a low-end device.
 */
export function cloudinaryTextureUrl(src: string | null | undefined, size = 1024): string {
    if (!src) return "";
    const capped = Math.min(size, 2048);
    return cloudinaryUrl(src, { width: capped, aspect: "3:4" }).replace(",dpr_auto", "");
}
