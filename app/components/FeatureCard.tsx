"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    colorClass?: string;
    delay?: number;
}

export default function FeatureCard({ title, description, icon: Icon, colorClass = "bg-primary", delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="card p-8 group hover:border-primary/20"
        >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-primary-dark group-hover:text-primary transition-colors">
                {title}
            </h3>
            <p className="text-text-body leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
