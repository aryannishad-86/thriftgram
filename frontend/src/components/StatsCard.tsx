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
            whileHover={{ y: -8, scale: 1.03 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            className="group relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-card via-base-2 to-card p-6 shadow-lg transition-all hover:shadow-2xl hover:border-primary/50 overflow-hidden"
        >
            {/* Animated background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transform translate-x-8 -translate-y-8" />

            <div className="relative flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <p className="text-xs font-bold text-base-01 uppercase tracking-widest">{title}</p>
                    <h3 className="text-4xl font-black text-base-03 tracking-tight bg-gradient-to-r from-base-03 to-primary bg-clip-text">{value}</h3>
                    {description && (
                        <p className="text-sm text-base-02 font-medium">{description}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-success">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>{trend}</span>
                        </div>
                    )}
                </div>
                <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-white shadow-lg shadow-primary/30 border-2 border-white/20"
                >
                    {icon}
                </motion.div>
            </div>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
