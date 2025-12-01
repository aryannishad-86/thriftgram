'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientIconButtonProps {
    icon: LucideIcon;
    label: string;
    gradient: string;
    onClick?: () => void;
    badgeCount?: number;
    className?: string;
}

export default function GradientIconButton({
    icon: Icon,
    label,
    gradient,
    onClick,
    badgeCount,
    className
}: GradientIconButtonProps) {
    return (
        <motion.button
            onClick={onClick}
            className={cn("relative flex items-center overflow-hidden rounded-full bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-500 group", className)}
            initial={{ width: '40px', height: '40px' }}
            whileHover={{ width: '140px' }}
        >
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-20`} />

            {/* Glow Effect */}
            <div className={`absolute inset-0 blur-xl bg-gradient-to-r ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-40`} />

            {/* Icon Container */}
            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground transition-all duration-500 group-hover:scale-0 group-hover:opacity-0" />
                {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse group-hover:opacity-0 transition-opacity duration-300" />
                )}
            </div>

            {/* Text Container */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:delay-100">
                <span className={`text-sm font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent whitespace-nowrap flex items-center gap-2`}>
                    {label}
                    {badgeCount !== undefined && badgeCount > 0 && (
                        <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-white/80">
                            {badgeCount}
                        </span>
                    )}
                </span>
            </div>
        </motion.button>
    );
}
