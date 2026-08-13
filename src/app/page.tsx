'use client';

import Link from 'next/link'
import { SpotlightCard } from "@/components/spotlight-card";
import { MagicBorderButton } from "@/components/magic-border-button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">

      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-up">

        {/* Editorial Heading */}
        <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter leading-[1.1] text-balance">
          Automate your <br className="hidden md:block"/>
          <span className="italic text-accent-neon font-light">creative</span> workflows.
        </h1>

        <p className="text-lg md:text-xl text-[#888] font-mono tracking-tight max-w-xl mx-auto text-balance delay-100 animate-fade-up">
          Train an AI agent on your distinct voice, tone, and format. Generate high-converting content across platforms, instantly.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 delay-200 animate-fade-up">
          <Link href="/onboarding" className="w-full sm:w-auto">
            <MagicBorderButton containerClassName="w-full sm:w-auto" className="gap-2 text-base font-semibold">
              Start Training
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
              </svg>
            </MagicBorderButton>
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-sm font-medium text-white/70 hover:text-white transition-colors px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-sm"
          >
            Sign in
          </Link>
        </div>

        {/* Fake decorative data points */}
        <div className="pt-24 grid grid-cols-2 md:grid-cols-4 gap-4 delay-300 animate-fade-up">
          {[
            { label: 'Voice models', val: '12', inc: '+3' },
            { label: 'Generations', val: '1.2k', inc: '+140' },
            { label: 'Avg time saved', val: '14h', inc: '/mo' },
            { label: 'Platform syncs', val: '99.9%', inc: 'UP' }
          ].map((stat, i) => (
            <SpotlightCard key={i} className="p-6 text-left group">
              <div className="text-[10px] uppercase font-mono text-white/40 tracking-widest mb-4 group-hover:text-white transition-colors">{stat.label}</div>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-serif text-white/90">{stat.val}</div>
                <div className="text-xs font-mono text-white/30 mb-1">{stat.inc}</div>
              </div>
            </SpotlightCard>
          ))}
        </div>

      </div>
    </div>
  )
}
