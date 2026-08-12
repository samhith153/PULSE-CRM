'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PlatformFeature } from '@/data/platformFeatures';

interface PlatformCTAProps {
  feature: PlatformFeature;
}

export default function PlatformCTA({ feature }: PlatformCTAProps) {
  const handleLearnMore = () => {
    const capabilitiesSection = document.getElementById('capabilities');
    if (capabilitiesSection) {
      capabilitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 lg:py-20 px-6 lg:px-12 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/3 via-transparent to-blue-600/3" />
      
      <div className="relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm rounded-3xl lg:rounded-4xl border border-white/50 shadow-xl p-8 lg:p-10 text-center relative overflow-hidden"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-600/5 rounded-3xl lg:rounded-4xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
          
          <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight tracking-tight"
            style={{ color: '#0f172a' }}>
            {feature.ctaTitle}
          </motion.div>
            
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm md:text-base mb-6 md:mb-8 leading-relaxed max-w-xl mx-auto"
            style={{ color: '#64748b' }}>
            {feature.ctaDescription}
          </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={feature.primaryAction.href}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-white text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  style={{ background: '#2563EB', color: '#FFFFFF', border: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1D4ED8'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#2563EB'; }}
                >
                  {feature.primaryAction.text}
                  <ArrowRight size={16} color="#FFFFFF" className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={handleLearnMore}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  style={{ background: '#fff', border: '1.5px solid #e5e7eb', color: '#374151' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLElement).style.color = '#2563EB'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                >
                  {feature.secondaryAction.text}
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-6 right-6 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-20" />
          <div className="absolute bottom-6 left-6 w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-30" />
        </motion.div>
      </div>
    </section>
  );
}