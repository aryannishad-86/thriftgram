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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-md hover:shadow-xl hover:border-primary transition-all"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">{title}</p>
                    <h3 className="text-4xl font-black text-base-03 tracking-tight">{value}</h3>
                    {description && (
                        <p className="text-sm text-base-02">{description}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-primary mt-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 rounded-xl bg-primary/10 p-3.5 text-primary border-2 border-primary/20">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
