'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { cloudinaryTextureUrl } from '@/lib/cloudinary';
import type { FeaturedItem } from './types';

/**
 * The three.js signature moment: garments as textured planes on an
 * infinite, drag/wheel-scrollable strip, bending like pages whipping past
 * under fast scroll velocity and lying flat at rest. Ported from the
 * Codrops/OGL scroll-gallery technique (shared geometry, per-plane
 * ShaderMaterial, velocity-driven vertex bend, cover-fit UV in the
 * fragment shader) — applied horizontally here since this is a strip
 * inside a normal page, not a dedicated full-viewport scroller.
 *
 * This file is loaded via next/dynamic({ssr:false}) from Gallery.tsx and
 * must never be imported anywhere else — see the capability gates in
 * webgl-support.ts and the path exclusions in Gallery.tsx for why.
 */

const PLANE_ASPECT = 3 / 4;
const PLANE_HEIGHT = 2.6; // world units
const PLANE_WIDTH = PLANE_HEIGHT * PLANE_ASPECT;
const GAP = 0.9;
const SEGMENTS_X = 48;
const MAX_BEND = 0.9;
const DRAG_CLICK_THRESHOLD_PX = 6;

const VERTEX_SHADER = /* glsl */ `
    uniform float uBend;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 pos = position;
        // A bow, strongest at plane center and ~0 at the leading/trailing
        // edges — reads as a page curling under velocity, not a hinge.
        float bow = sin(uv.x * 3.14159265);
        pos.z += bow * uBend;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const FRAGMENT_SHADER = /* glsl */ `
    uniform sampler2D uTexture;
    uniform vec2 uImageSize;
    uniform vec2 uPlaneSize;
    uniform float uHover;
    varying vec2 vUv;
    void main() {
        // Cover-fit UV remap — identical math to CSS object-fit: cover.
        // Without this, arbitrary-aspect user photos stretch or letterbox
        // instead of filling the frame the way the DOM gallery's <Image>
        // fill+object-cover already does.
        float planeAspect = uPlaneSize.x / uPlaneSize.y;
        float imageAspect = uImageSize.x / uImageSize.y;
        vec2 ratio = vec2(
            min(planeAspect / imageAspect, 1.0),
            min(imageAspect / planeAspect, 1.0)
        );
        vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );
        vec4 color = texture2D(uTexture, uv);
        // Gallery-spotlight hover cue: brighten toward the resting image,
        // dim slightly when something else has focus. Deliberately not a
        // scale/rotate trick (that's the CSS fallback's language) — on a
        // shader gallery the light itself should be the affordance.
        color.rgb *= mix(0.78, 1.04, uHover);
        gl_FragColor = color;
    }
`;

function makePlaceholderTexture(): THREE.DataTexture {
    const data = new Uint8Array([26, 26, 30, 255]); // --surface, roughly
    const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
    tex.needsUpdate = true;
    return tex;
}

interface MeshEntry {
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    baseX: number;
    item: FeaturedItem;
}

export default function ShaderGallery({ items }: { items: FeaturedItem[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const container = containerRef.current;
        if (!container || items.length === 0) return;

        let disposed = false;

        // ---- scene setup ----------------------------------------------------
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        camera.position.z = 5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        renderer.domElement.style.cursor = 'grab';

        const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, SEGMENTS_X, 1);
        const totalWidth = items.length * (PLANE_WIDTH + GAP);
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = 'anonymous';

        const entries: MeshEntry[] = items.map((item, i) => {
            const material = new THREE.ShaderMaterial({
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
                uniforms: {
                    uTexture: { value: makePlaceholderTexture() },
                    uImageSize: { value: new THREE.Vector2(1, 1) },
                    uPlaneSize: { value: new THREE.Vector2(PLANE_WIDTH, PLANE_HEIGHT) },
                    uBend: { value: 0 },
                    uHover: { value: 0 },
                },
                transparent: true,
            });
            const mesh = new THREE.Mesh(geometry, material);
            const baseX = i * (PLANE_WIDTH + GAP);
            mesh.position.x = baseX;
            mesh.userData.itemId = item.id;
            scene.add(mesh);

            const rawImage = item.images.length > 0 ? item.images[0].image : '/placeholder.jpg';
            const textureUrl = cloudinaryTextureUrl(rawImage, 900);
            loader.load(
                textureUrl,
                (texture) => {
                    if (disposed) {
                        // Component unmounted while this request was in flight —
                        // don't attach a texture to a material that's already
                        // been (or is about to be) disposed.
                        texture.dispose();
                        return;
                    }
                    texture.colorSpace = THREE.SRGBColorSpace;
                    const oldTexture = material.uniforms.uTexture.value as THREE.Texture;
                    material.uniforms.uTexture.value = texture;
                    material.uniforms.uImageSize.value.set(
                        texture.image.width || 1,
                        texture.image.height || 1
                    );
                    oldTexture.dispose();
                },
                undefined,
                (err) => {
                    // Non-fatal: this plane keeps its placeholder fill rather
                    // than breaking the whole gallery over one failed image.
                    console.error('ShaderGallery: failed to load texture', textureUrl, err);
                }
            );

            return { mesh, material, baseX, item };
        });

        // ---- input: wheel + drag both feed one smoothed scroll value --------
        const scrollState = { current: 0, target: 0, velocity: 0 };
        let isDragging = false;
        let dragStartX = 0;
        let dragStartScroll = 0;
        let pointerDownX = 0;
        let pointerDownY = 0;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            scrollState.target += delta * 0.02;
        };

        const onPointerDown = (e: PointerEvent) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartScroll = scrollState.target;
            pointerDownX = e.clientX;
            pointerDownY = e.clientY;
            renderer.domElement.style.cursor = 'grabbing';
            renderer.domElement.setPointerCapture(e.pointerId);
        };

        const raycaster = new THREE.Raycaster();
        const pointerNDC = new THREE.Vector2();
        let hoveredEntry: MeshEntry | null = null;

        const updatePointerNDC = (e: PointerEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        };

        const onPointerMove = (e: PointerEvent) => {
            updatePointerNDC(e);
            if (isDragging) {
                scrollState.target = dragStartScroll - (e.clientX - dragStartX) * 0.012;
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            isDragging = false;
            renderer.domElement.style.cursor = 'grab';
            renderer.domElement.releasePointerCapture(e.pointerId);

            const movedDistance = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
            if (movedDistance < DRAG_CLICK_THRESHOLD_PX && hoveredEntry) {
                router.push(`/items/${hoveredEntry.item.id}`);
            }
        };

        renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointermove', onPointerMove);
        renderer.domElement.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('pointerleave', () => {
            if (hoveredEntry) {
                hoveredEntry.material.uniforms.uHover.value = 0;
                hoveredEntry = null;
            }
            if (labelRef.current) labelRef.current.style.opacity = '0';
        });

        // ---- resize -----------------------------------------------------------
        const resize = () => {
            const { clientWidth, clientHeight } = container;
            if (clientWidth === 0 || clientHeight === 0) return;
            camera.aspect = clientWidth / clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(clientWidth, clientHeight);
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // ---- animation loop -----------------------------------------------------
        let rafId = 0;
        const animate = () => {
            rafId = requestAnimationFrame(animate);

            const prevCurrent = scrollState.current;
            scrollState.current += (scrollState.target - scrollState.current) * 0.08;
            scrollState.velocity = scrollState.current - prevCurrent;

            const bendMagnitude = Math.min(Math.abs(scrollState.velocity) * 8, MAX_BEND);

            for (const entry of entries) {
                // Wrap into a range centered on the camera so planes recycle
                // from one edge to the other with no visible pop — a true
                // infinite loop from a finite set of textures.
                let x = entry.baseX - scrollState.current;
                x = ((x + totalWidth / 2) % totalWidth + totalWidth) % totalWidth - totalWidth / 2;
                entry.mesh.position.x = x;
                entry.material.uniforms.uBend.value = bendMagnitude;
            }

            // Hover raycast — only meaningful when not actively dragging (a
            // drag shouldn't fight the user for which plane looks focused).
            if (!isDragging) {
                raycaster.setFromCamera(pointerNDC, camera);
                const hits = raycaster.intersectObjects(entries.map((e) => e.mesh));
                const hitEntry = hits.length > 0
                    ? entries.find((e) => e.mesh === hits[0].object) ?? null
                    : null;

                if (hitEntry !== hoveredEntry) {
                    if (hoveredEntry) hoveredEntry.material.uniforms.uHover.value = 0;
                    hoveredEntry = hitEntry;
                }
                if (hoveredEntry) {
                    hoveredEntry.material.uniforms.uHover.value = THREE.MathUtils.lerp(
                        hoveredEntry.material.uniforms.uHover.value,
                        1,
                        0.15
                    );
                }

                if (labelRef.current) {
                    if (hoveredEntry) {
                        const worldPos = hoveredEntry.mesh.position.clone();
                        worldPos.project(camera);
                        const rect = container.getBoundingClientRect();
                        const screenX = (worldPos.x * 0.5 + 0.5) * rect.width;
                        const screenY = (-worldPos.y * 0.5 + 0.5) * rect.height;
                        labelRef.current.style.opacity = '1';
                        labelRef.current.style.transform = `translate(${screenX}px, ${screenY + 90}px) translate(-50%, 0)`;
                        labelRef.current.textContent = `${hoveredEntry.item.title} — ₹${hoveredEntry.item.price}`;
                    } else {
                        labelRef.current.style.opacity = '0';
                    }
                }
            }

            renderer.render(scene, camera);
        };
        animate();

        // ---- teardown -----------------------------------------------------------
        return () => {
            disposed = true;
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('wheel', onWheel);
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            renderer.domElement.removeEventListener('pointermove', onPointerMove);
            renderer.domElement.removeEventListener('pointerup', onPointerUp);

            geometry.dispose();
            for (const entry of entries) {
                entry.material.uniforms.uTexture.value?.dispose();
                entry.material.dispose();
            }
            renderer.dispose();
            renderer.forceContextLoss();
            if (renderer.domElement.parentElement === container) {
                container.removeChild(renderer.domElement);
            }
        };
        // items is intentionally the only dependency — a change in the
        // featured set tears down and rebuilds the whole scene rather than
        // trying to diff meshes in place, which isn't worth the complexity
        // for content that only changes on a cache TTL, not per-frame.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items]);

    return (
        <section className="py-16">
            <h2 className="font-display mb-8 text-center text-2xl font-semibold text-foreground">
                Featured Collection
            </h2>
            <div ref={containerRef} className="relative h-[60vh] w-full touch-none">
                <div
                    ref={labelRef}
                    className="label-meta pointer-events-none absolute left-0 top-0 whitespace-nowrap text-foreground opacity-0 transition-opacity duration-150"
                />
            </div>
        </section>
    );
}
