'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, Users, Building2, TrendingUp, Briefcase, CheckSquare, 
  Activity, Database, UserCheck, BarChart3 
} from 'lucide-react';
import { PlatformFeature } from '@/data/platformFeatures';

interface PlatformCapabilitiesProps {
  feature: PlatformFeature;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  Target,
  Users,
  Building2,
  TrendingUp,
  Briefcase,
  CheckSquare,
  Activity,
  Database,
  UserCheck,
  BarChart3,
};

export default function PlatformCapabilities({ feature }: PlatformCapabilitiesProps) {
  return (
    <section id="capabilities" className="py-16 md:py-24 px-6 lg:px-12 bg-white relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
      
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight tracking-tight animate-fade-in" style={{ color: '#0f172a' }}>
            Everything you need to manage {
              feature.eyebrow === 'TASKS & FOLLOW-UPS' 
                ? 'tasks & follow-ups'
                : feature.eyebrow.toLowerCase().replace('management', '').replace('sales ', '').trim() + 
                  (feature.eyebrow.includes('MANAGEMENT') ? 's' : '')
            }
          </h2>
          <div className="w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }} />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { 
              transition: { 
                staggerChildren: 0.15 
              } 
            }
          }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {feature.capabilities.map((capability, index) => {
            const Icon = iconMap[capability.icon] || Target;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ 
                  y: -6, 
                  boxShadow: '0 20px 40px rgba(37, 99, 235, 0.12)',
                  scale: 1.01
                }}
                transition={{ duration: 0.25 }}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20 }}
                className="group relative p-6 md:p-8 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    transition={{ duration: 0.25 }}
                    style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 12 }}
                    className="w-12 h-12 flex items-center justify-center mb-5 lg:mb-6 transition-all duration-300 shadow-sm"
                  >
                    <Icon size={22} color="#2563EB" />
                  </motion.div>
                  
                  <h3 className="text-lg md:text-xl font-semibold mb-3 leading-tight" style={{ color: '#0f172a' }}>
                    {capability.title}
                  </h3>
                  
                  <p className="leading-relaxed text-sm md:text-base" style={{ color: '#64748b' }}>
                    {capability.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}