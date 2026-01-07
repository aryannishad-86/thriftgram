'use client';

import React, { useEffect, useRef } from 'react';

interface RippleTextProps {
    text: string;
    className?: string;
    fontSize?: number;
    colors?: string[];
}

export default function RippleText({ text, className, fontSize = 60, colors }: RippleTextProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
    const rippleRef = useRef({ x: 0, y: 0, strength: 0 });
    const colorRef = useRef<string[]>(['#002b36', '#002b36']); // Default to base-03 (dark)

    useEffect(() => {
        // Extract color from className if provided
        if (className && !colors) {
            const tempDiv = document.createElement('div');
            tempDiv.className = className;
            tempDiv.style.position = 'absolute';
            tempDiv.style.visibility = 'hidden';
            document.body.appendChild(tempDiv);
            const computedColor = window.getComputedStyle(tempDiv).color;
            document.body.removeChild(tempDiv);

            if (computedColor) {
                colorRef.current = [computedColor, computedColor];
            }
        } else if (colors) {
            colorRef.current = colors;
        }
    }, [className, colors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.targetX = e.clientX - rect.left;
            mouseRef.current.targetY = e.clientY - rect.top;

            // Boost ripple strength on movement
            rippleRef.current.strength = 1;
        };

        const handleMouseLeave = () => {
            rippleRef.current.strength = 0;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        const render = () => {
            // Smooth mouse movement
            mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
            mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

            // Decay ripple strength
            rippleRef.current.strength *= 0.95;

            ctx.clearRect(0, 0, width, height);
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;

            // Center text vertically, align left horizontally
            const startX = 0;
            const startY = height / 2;

            // Draw text with distortion
            const sliceWidth = 2;
            for (let i = 0; i < textWidth; i += sliceWidth) {
                const x = startX + i;

                // Calculate distance from mouse to this slice
                const dx = x - mouseRef.current.x;
                const dy = startY - mouseRef.current.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Ripple effect calculation
                const maxDist = 200;
                let distortionY = 0;

                if (dist < maxDist) {
                    const influence = (1 - dist / maxDist) * rippleRef.current.strength;
                    distortionY = Math.sin(dist * 0.04 - Date.now() * 0.001) * influence * 5;
                }

                // Draw the slice
                ctx.save();
                ctx.beginPath();
                ctx.rect(i, 0, sliceWidth, height);
                ctx.clip();

                // Use the extracted color
                ctx.fillStyle = colorRef.current[0];

                ctx.fillText(text, startX, startY + distortionY);
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [text, fontSize]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-[120px] cursor-default ${className}`}
        />
    );
}
