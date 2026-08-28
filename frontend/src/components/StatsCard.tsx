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
            className="group relative overflow-hidden border border-border bg-card p-6 transition-colors duration-300 hover:border-line-strong"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="label-meta mb-2 text-muted">
                        {title}
                    </p>
                    <h3 className="font-mono text-3xl text-foreground mb-1">
                        {value}
                    </h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                    {trend && (
                        <p className="label-meta mt-2 text-foreground">
                            ↗ {trend}
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 border border-border bg-base-2 p-3 text-foreground">
                    {icon}
                </div>
            </div>
        </motion.div>
    );
}
