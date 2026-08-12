'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { PlatformFeature } from '@/data/platformFeatures';
import PlatformPreview from './PlatformPreview';

interface PlatformHeroProps {
  feature: PlatformFeature;
}

export default function PlatformHero({ feature }: PlatformHeroProps) {
  const handleLearnMore = () => {
    const capabilitiesSection = document.getElementById('capabilities');
    if (capabilitiesSection) {
      capabilitiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative py-16 md:py-24 px-6 lg:px-12 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/4 via-transparent to-blue-600/3" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.03 }}
        transition={{ duration: 1.5 }}
        className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-radial from-blue-600 to-transparent pointer-events-none"
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.02 }}
        transition={{ duration: 1.8, delay: 0.3 }}
        className="absolute bottom-[-300px] left-[-300px] w-[700px] h-[700px] bg-gradient-radial from-blue-600 to-transparent pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <nav className="text-xs font-medium text-gray-500">
            <Link 
              href="/" 
              className="hover:text-blue-600 transition-colors duration-200"
            >
              Platform
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-700 font-semibold">
              {feature.eyebrow.charAt(0) + feature.eyebrow.slice(1).toLowerCase()}
            </span>
          </nav>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full" style={{ background: '#EFF6FF', border: '1px solid #DBEAFE' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#2563EB' }}>
                {feature.eyebrow}
              </span>
            </div>
            
            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
              {feature.title}
            </h1>
            
            {/* Description */}
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl font-medium">
              {feature.description}
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
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
            </div>
          </motion.div>

          {/* Right: UI Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative"
          >
            {/* Glow effect behind preview */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 to-blue-200/40 rounded-3xl blur-2xl transform scale-110" />
            
            {/* Preview container */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl border border-white/50 shadow-2xl overflow-hidden">
              <PlatformPreview type={feature.previewType} />
            </div>
            
            {/* Additional accent elements */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-20 animate-pulse" />
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '1s' }} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}