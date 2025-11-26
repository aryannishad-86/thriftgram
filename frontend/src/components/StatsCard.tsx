import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    description?: string;
}

export default function StatsCard({ title, value, icon, trend, description }: StatsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-[0_0_30px_-10px_rgba(109,40,217,0.3)]"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold text-white tracking-tight">{value}</h3>
                    {description && (
                        <p className="mt-1 text-xs text-white/60">{description}</p>
                    )}
                    {trend && (
                        <p className="mt-1 text-xs text-green-400">{trend}</p>
                    )}
                </div>
                <div className="rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 p-3 text-primary border border-primary/20">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
