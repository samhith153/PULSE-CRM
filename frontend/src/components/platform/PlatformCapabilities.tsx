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
const iconMap: Record<string, React.ElementType> = {
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
    <section id="capabilities" className="py-20 lg:py-28 px-6 lg:px-12 bg-white relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white" />
      
      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight tracking-tight" style={{ color: '#0f172a' }}>
            Everything you need to manage {
              feature.eyebrow === 'TASKS & FOLLOW-UPS' 
                ? 'tasks & follow-ups'
                : feature.eyebrow.toLowerCase().replace('management', '').replace('sales ', '').trim() + 
                  (feature.eyebrow.includes('MANAGEMENT') ? 's' : '')
            }
          </h2>
          <div className="w-24 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }} />
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { 
              transition: { 
                staggerChildren: 0.2 
              } 
            }
          }}
          className="grid md:grid-cols-3 gap-8 lg:gap-10"
        >
          {feature.capabilities.map((capability, index) => {
            const Icon = iconMap[capability.icon] || Target;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ 
                  y: -8, 
                  boxShadow: '0 25px 50px rgba(37, 99, 235, 0.15)',
                  scale: 1.02
                }}
                transition={{ duration: 0.3 }}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24 }}
                className="group relative p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    style={{ background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 16 }}
                    className="w-16 h-16 flex items-center justify-center mb-6 lg:mb-8 transition-all duration-300 shadow-sm"
                  >
                    <Icon size={28} color="#2563EB" />
                  </motion.div>
                  
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-5 leading-tight" style={{ color: '#0f172a' }}>
                    {capability.title}
                  </h3>
                  
                  <p className="leading-relaxed text-base lg:text-lg" style={{ color: '#64748b' }}>
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