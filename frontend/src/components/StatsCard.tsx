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
            whileHover={{ y: -8 }}
            transition={{ duration: 0.3 }}
            className="group relative overflow-hidden rounded-2xl border-2 border-border p-6 shadow-md hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: '#F7F1E3' }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-base-02 uppercase tracking-wide mb-2">
                        {title}
                    </p>
                    <h3 className="text-3xl font-bold text-base-03 mb-1">
                        {value}
                    </h3>
                    {description && (
                        <p className="text-sm text-base-02">
                            {description}
                        </p>
                    )}
                    {trend && (
                        <p className="text-xs font-semibold text-base-03 mt-2">
                            ↗ {trend}
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 rounded-lg bg-base-03/5 p-3 text-base-03">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
