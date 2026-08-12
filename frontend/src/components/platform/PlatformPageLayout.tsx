'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/shared/PageTemplates';
import PlatformHero from './PlatformHero';
import PlatformCapabilities from './PlatformCapabilities';
import PlatformCTA from './PlatformCTA';
import { PlatformFeature } from '@/data/platformFeatures';

interface PlatformPageLayoutProps {
  feature: PlatformFeature;
}

export default function PlatformPageLayout({ feature }: PlatformPageLayoutProps) {
  return (
    <PageContainer>
      <PlatformHero feature={feature} />
      <PlatformCapabilities feature={feature} />
      <PlatformCTA feature={feature} />
    </PageContainer>
  );
}