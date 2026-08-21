'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, ArrowLeft, Target, AlignLeft } from 'lucide-react'
import { SpotlightCard } from "@/components/spotlight-card";
import { MagicBorderButton } from "@/components/magic-border-button";

// Mock platforms taking from DB structure
const AVAILABLE_PLATFORMS = [
  { id: 'twitter', label: 'X (Twitter)', maxLength: 280 },
  { id: 'linkedin', label: 'LinkedIn', maxLength: 3000 },
  { id: 'instagram', label: 'Instagram Caption', maxLength: 2200 },
  { id: 'youtube', label: 'YouTube Description', maxLength: 5000 },
  { id: 'tiktok', label: 'TikTok Caption', maxLength: 2200 },
]

export default function NewCampaign() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [sourceText, setSourceText] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [rules, setRules] = useState('')
  const [requiredTerms, setRequiredTerms] = useState('')
  const [forbiddenTerms, setForbiddenTerms] = useState('')

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !sourceText || platforms.length === 0) return
    setIsSubmitting(true)

    try {
      // Mock API call to create campaign and trigger generation
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          source_text: sourceText,
          platforms,
          sponsor_brief: {
            audience,
            tone,
            rules,
            required_terms: requiredTerms
              ? requiredTerms.split(',').map((term) => term.trim()).filter(Boolean)
              : [],
            forbidden_terms: forbiddenTerms
              ? forbiddenTerms.split(',').map((term) => term.trim()).filter(Boolean)
              : [],
          },
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create campaign')
      }

      const { id } = await res.json()

      // Redirect to the campaign details page to view generated content
      router.push(`/campaigns/${id}`)

    } catch (error) {
      console.error(error)
      alert("Error occurred creating campaign. Check that Supabase and your Minds agent are configured.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-up">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#666] hover:text-accent-neon transition-colors mb-12">
        <ArrowLeft size={14} /> Back to Command Center
      </Link>

      <div className="mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tighter mb-3">
            Initialize <span className="italic font-light text-accent-neon text-shadow-glow">Sequence</span>
          </h1>
          <p className="text-sm font-mono text-[#888] tracking-widest uppercase">
            Define narrative and targeting parameters
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">

        {/* Step 1 */}
        <div className="flex gap-4 md:gap-8 group">
          <div className="hidden md:flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-accent-neon flex items-center justify-center text-accent-neon font-mono text-sm leading-none z-10 bg-background">01</div>
            <div className="w-px h-full bg-[#222] my-4 group-hover:bg-accent-neon transition-colors"></div>
          </div>
          <div className="flex-1 space-y-6">
            <SpotlightCard className="p-8 md:p-10">
              <label htmlFor="title" className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-accent-neon mb-6">
                <Target size={14}/> Campaign Designation
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Q3 SaaS Expansion Launch"
                className="w-full bg-transparent border-0 border-b border-[#333] pb-4 text-2xl md:text-3xl font-serif placeholder-[#333] focus:ring-0 focus:outline-none focus:border-accent-neon transition-colors rounded-none px-0 text-white/90"
                required
              />
            </SpotlightCard>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4 md:gap-8 group">
           <div className="hidden md:flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-accent-neon flex items-center justify-center text-accent-neon font-mono text-sm leading-none z-10 bg-background">02</div>
            <div className="w-px h-full bg-[#222] my-4 group-hover:bg-accent-neon transition-colors"></div>
          </div>
          <div className="flex-1 space-y-6">
            <SpotlightCard className="p-8 md:p-10">
              <label htmlFor="source" className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-accent-neon mb-6">
                <AlignLeft size={14}/> Source Material
              </label>
              <div className="relative">
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-accent-neon animate-pulse hidden md:block"></div>
                <textarea
                  id="source"
                  value={sourceText}
                  onChange={e => setSourceText(e.target.value)}
                  placeholder="Paste your central narrative, raw thoughts, or core messaging here. The agent will adapt this into platform-native formats."
                  className="w-full min-h-[200px] bg-[#050505] border border-white/10 p-6 md:pl-10 text-white/80 font-sans text-sm md:text-base leading-relaxed placeholder-white/20 focus:ring-0 focus:outline-none focus:border-accent-neon transition-colors resize-y rounded-none"
                  required
                />
              </div>
            </SpotlightCard>
          </div>
        </div>

                {/* Step 3 */}
        <div className="flex gap-4 md:gap-8 group">
          <div className="hidden md:flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-accent-neon flex items-center justify-center text-accent-neon font-mono text-sm leading-none z-10 bg-background">03</div>
            <div className="w-px h-full bg-[#222] my-4 group-hover:bg-accent-neon transition-colors"></div>
          </div>
          <div className="flex-1 space-y-6">
            <SpotlightCard className="p-8 md:p-10">
              <label className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-accent-neon mb-6">
                 Constraint Directives (Optional)
              </label>
              <div className="space-y-4">
                <input
                  type="text"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  placeholder="Target Audience (e.g., startup founders)"
                  className="w-full bg-[#050505] border border-white/10 p-4 text-white/80 font-sans text-sm md:text-base placeholder-white/20 focus:outline-none focus:border-accent-neon transition-colors"
                />
                <input
                  type="text"
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  placeholder="Tone Constraints (e.g., informative, not salesy)"
                  className="w-full bg-[#050505] border border-white/10 p-4 text-white/80 font-sans text-sm md:text-base placeholder-white/20 focus:outline-none focus:border-accent-neon transition-colors"
                />
                <input
                  type="text"
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  placeholder="General Brand Rules (optional)"
                  className="w-full bg-[#050505] border border-white/10 p-4 text-white/80 font-sans text-sm md:text-base placeholder-white/20 focus:outline-none focus:border-accent-neon transition-colors"
                />
                <input
                  type="text"
                  value={requiredTerms}
                  onChange={e => setRequiredTerms(e.target.value)}
                  placeholder="Required Terms, comma separated (e.g., pricing, discount code)"
                  className="w-full bg-[#050505] border border-white/10 p-4 text-white/80 font-sans text-sm md:text-base placeholder-white/20 focus:outline-none focus:border-accent-neon transition-colors"
                />
                <input
                  type="text"
                  value={forbiddenTerms}
                  onChange={e => setForbiddenTerms(e.target.value)}
                  placeholder="Forbidden Terms, comma separated (e.g., competitor name, guarantee)"
                  className="w-full bg-[#050505] border border-white/10 p-4 text-white/80 font-sans text-sm md:text-base placeholder-white/20 focus:outline-none focus:border-accent-neon transition-colors"
                />
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4 md:gap-8 group">
          <div className="hidden md:flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-accent-neon flex items-center justify-center text-accent-neon font-mono text-sm leading-none z-10 bg-background">04</div>
          </div>
          <div className="flex-1 space-y-6">
            <SpotlightCard className="p-8 md:p-10">
              <label className="flex items-center gap-2 text-xs uppercase font-mono tracking-widest text-accent-neon mb-6">
                 Syndication Targets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_PLATFORMS.map(platform => {
                  const isSelected = platforms.includes(platform.id)
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`text-left p-4 border transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? 'border-accent-neon bg-accent-glow'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {isSelected && (
                         <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-accent-neon border-l-transparent"></div>
                      )}

                      <div className={`font-mono text-sm uppercase tracking-wider mb-2 ${isSelected ? 'text-accent-neon' : 'text-white/40'}`}>
                        {platform.label}
                      </div>
                      <div className="text-[10px] text-white/30 font-mono">
                        MAX: {platform.maxLength} CHARS
                      </div>
                    </button>
                  )
                })}
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end pt-8 md:pl-18">
          <MagicBorderButton
            type="submit"
            disabled={isSubmitting || platforms.length === 0 || !title || !sourceText}
            containerClassName={`w-full md:w-auto ${
              (platforms.length === 0 || !title || !sourceText) ? 'opacity-50 cursor-not-allowed filter grayscale' : ''
            }`}
            className="flex items-center gap-3 px-8 py-5 text-lg justify-center w-full"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-r-transparent rounded-full animate-spin"></div>
                Compiling...
              </>
            ) : (
              <>
                Execute Prompt Sequence
                <Sparkles size={20} className="fill-black" />
              </>
            )}
          </MagicBorderButton>
        </div>
      </form>
    </div>
  )
}
