"use client";

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import registry from './registry.json';
import { MotionConfig } from 'framer-motion';
import './theme.css';

const pages = {
  home: dynamic(() => import('./home')),
  'about-us': dynamic(() => import('./about-us')),
  'contact-us': dynamic(() => import('./contact-us')),
  qualification: dynamic(() => import('./qualification')),
  'professional-dev': dynamic(() => import('./professional-dev')),
  faqs: dynamic(() => import('./faqs')),
  'glossary-of-terms': dynamic(() => import('./glossary-of-terms')),
  'logo-use': dynamic(() => import('./logo-use')),
  'privacy-policy': dynamic(() => import('./privacy-policy')),
  'refund-policy': dynamic(() => import('./refund-policy')),
  'terms-of-services': dynamic(() => import('./terms-of-services')),
  'home-faq': dynamic(() => import('./home-faq')),
  courses: dynamic(() => import('./courses')),
  schedule: dynamic(() => import('./schedule')),
  registration: dynamic(() => import('./registration')),
  resources: dynamic(() => import('./resources')),
  'awarding-bodies': dynamic(() => import('./awarding-bodies')),
  'our-team': dynamic(() => import('./our-team')),
  'our-consultants': dynamic(() => import('./our-consultants')),
  accreditations: dynamic(() => import('./accreditations')),
  'course-detail': dynamic(() => import('./course-detail')),
  'awarding-body-detail': dynamic(() => import('./awarding-body-detail')),
  'resource-detail': dynamic(() => import('./resource-detail')),
  'professional-detail': dynamic(() => import('./professional-detail')),
};

export const PUBLIC_RENDERERS = Object.fromEntries(registry.flatMap(page => page.sections.map(section => {
  const isHomeFaq = page.key === 'home' && section.index === 6;
  const Page = pages[isHomeFaq ? 'home-faq' : page.key];
  function PublicSection({ p }) {
    if (!Page) return null;
    const safeP = p || {};
    const fonts = { sans: 'var(--font-geist-sans), sans-serif', serif: 'Georgia, serif', mono: 'var(--font-geist-mono), monospace' };
    const size = Number.parseFloat(safeP.sectionHeadingSize);
    const classes = ['public-page-theme', safeP.sectionBackground && 'public-page-background', safeP.sectionText && 'public-page-text', safeP.sectionHeading && 'public-page-heading', safeP.sectionAccent && 'public-page-accent', fonts[safeP.sectionFont] && 'public-page-font', size > 0 && 'public-page-size'].filter(Boolean).join(' ');
    return (
      <MotionConfig reducedMotion="user">
        <div
          className={classes}
          style={{
            '--public-bg': safeP.sectionBackground,
            '--public-text': safeP.sectionText,
            '--public-heading': safeP.sectionHeading,
            '--public-accent': safeP.sectionAccent,
            '--public-font': fonts[safeP.sectionFont],
            '--public-size': size > 0 ? `${Math.min(140, Math.max(18, size))}px` : undefined,
          }}
        >
          <Suspense fallback={<div className="min-h-[140px] flex items-center justify-center text-xs text-gray-400">Loading section...</div>}>
            <Page {...safeP} section={isHomeFaq ? undefined : section.index} />
          </Suspense>
        </div>
      </MotionConfig>
    );
  }
  return [section.type, PublicSection];
})));
