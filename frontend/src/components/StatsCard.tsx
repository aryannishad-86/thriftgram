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
            whileHover={{
                y: -8,
                scale: 1.03,
                transition: { duration: 0.3, type: "spring", stiffness: 300 }
            }}
            transition={{ duration: 0.4 }}
            className="group relative rounded-3xl border-2 border-primary/20  p-6 shadow-lg hover:shadow-2xl hover:border-primary transition-all duration-300 overflow-hidden" style={{ backgroundColor: "#F7F1E3" }}
        >
            {/* Animated background shimmer on hover */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Decorative corner element */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />

            <div className="relative flex items-start justify-between">
                <div className="flex-1 space-y-2">
                    <motion.p
                        className="text-xs font-bold text-base-03 uppercase tracking-wider"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {title}
                    </motion.p>

                    <motion.h3
                        className="text-4xl font-black text-base-03 tracking-tight"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        {value}
                    </motion.h3>

                    {description && (
                        <motion.p
                            className="text-sm text-base-02"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {description}
                        </motion.p>
                    )}

                    {trend && (
                        <motion.div
                            className="flex items-center gap-1.5 text-sm font-bold text-base-03 mt-2"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                animate={{ y: [0, -2, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </motion.svg>
                            <span>{trend}</span>
                        </motion.div>
                    )}
                </div>

                <motion.div
                    whileHover={{
                        rotate: [0, -10, 10, -10, 0],
                        scale: 1.1
                    }}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 rounded-xl bg-primary/10 p-3.5 text-primary border-2 border-primary/20 shadow-md group-hover:shadow-lg group-hover:bg-primary/15 transition-all duration-300"
                >
                    {icon}
                </motion.div>
            </div>

            {/* Bottom accent line that grows on hover */}
            <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "0%" }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.4 }}
            />
        </motion.div>
    );
}
