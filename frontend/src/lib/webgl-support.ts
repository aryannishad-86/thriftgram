/**
 * Capability gates for the three.js signature gallery (R5).
 *
 * three.js is ~500KB+ and never tree-shakes cleanly — every guardrail here
 * exists so it only ever loads for a viewer who can actually make use of it,
 * and never on a path that costs the business money if it goes wrong
 * (that's enforced at the call site, not here — see Gallery.tsx). The CSS
 * gallery this falls back to has to look good entirely on its own; nothing
 * here should be read as "WebGL is the real feature, CSS is the apology."
 */

const MOBILE_BREAKPOINT_PX = 1024; // three.js is desktop-only; below this, prefer the CSS gallery for battery/perf
const MIN_DEVICE_MEMORY_GB = 4; // navigator.deviceMemory, where supported

export function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * True WebGL2 support, not just "getContext didn't throw" — creates a real
 * context and confirms it, then explicitly loses it so this probe doesn't
 * itself hold a context slot (most browsers cap concurrent WebGL contexts;
 * leaking probe contexts is a real way to make the REAL gallery fail later).
 */
export function hasWebGL2(): boolean {
    if (typeof document === "undefined") return false;
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2");
        if (!gl) return false;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
    } catch {
        return false;
    }
}

/**
 * Coarse "is this a capable desktop" heuristic. navigator.deviceMemory is
 * Chromium-only (undefined on Safari/Firefox) — undefined is treated as
 * "unknown, don't block on it" rather than failing those browsers closed.
 * Viewport width is the part that actually matters everywhere: three.js is
 * deliberately desktop-gated per the plan, independent of raw capability.
 */
export function isCapableViewport(): boolean {
    if (typeof window === "undefined") return false;
    if (window.innerWidth < MOBILE_BREAKPOINT_PX) return false;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof deviceMemory === "number" && deviceMemory < MIN_DEVICE_MEMORY_GB) return false;

    return true;
}

/** All three gates in one call — what Gallery.tsx actually checks. */
export function canUseShaderGallery(): boolean {
    return hasWebGL2() && !prefersReducedMotion() && isCapableViewport();
}
