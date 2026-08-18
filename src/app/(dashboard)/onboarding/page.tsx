'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PLATFORM_OPTIONS = [
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube (Scripts/Descriptions)' },
  { id: 'tiktok', label: 'TikTok' },
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [voiceSample, setVoiceSample] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['twitter', 'linkedin'])
  const [saving, setSaving] = useState(false)

  const togglePlatform = (id: string) => {
    setPlatforms((current) =>
      current.includes(id)
        ? current.filter((platformId) => platformId !== id)
        : [...current, id],
    )
  }

  const canContinue =
    step === 1
      ? voiceSample.trim().length > 0
      : step === 2
        ? platforms.length > 0
        : true

  const saveProfile = async () => {
    if (saving) return
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase.from('creators').upsert(
        {
          id: user.id,
          email: user.email ?? null,
          voice_profile: {
            sample: voiceSample.trim(),
            platforms,
            extracted_traits: [
              'Tone: Casual but informative',
              'Formatting: Short paragraphs with clear calls to action',
              `Platform defaults: ${platforms.join(', ')}`,
            ],
          },
        },
        { onConflict: 'id' },
      )

      if (error) {
        throw error
      }

      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      alert('Failed to save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white">Train Your AI Memory</h2>
        <p className="mt-4 text-lg text-[#888]">
          Let&apos;s align the AI with your unique voice and constraints.
        </p>
      </div>

      <div className="vercel-card overflow-hidden">
        {step === 1 && (
          <div className="p-8">
            <h3 className="text-xl font-medium text-white mb-6">Step 1: Your Voice</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="voice-sample" className="block text-sm font-medium text-[#888] mb-2">
                  Paste a piece of content you are proud of:
                </label>
                <textarea
                  id="voice-sample"
                  rows={5}
                  value={voiceSample}
                  onChange={(event) => setVoiceSample(event.target.value)}
                  className="mt-1 block w-full rounded-md bg-[#111] border-[#333] text-white shadow-sm focus:border-white focus:ring-white sm:text-sm p-2 border transition-colors"
                  placeholder="e.g. A recent successful tweet thread or paragraph from a script..."
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canContinue}
                className="w-full justify-center py-2 px-4 vercel-button-primary disabled:opacity-50"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8">
            <h3 className="text-xl font-medium text-white mb-6">Step 2: Platform Preferences</h3>
            <div className="space-y-6 p-4">
              <p className="text-sm text-[#888]">
                Select platforms you frequently post on to set up defaults.
              </p>
              <div className="space-y-2">
                {PLATFORM_OPTIONS.map((option) => (
                  <label key={option.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={platforms.includes(option.id)}
                      onChange={() => togglePlatform(option.id)}
                      className="rounded bg-[#111] border-[#333] text-white focus:ring-white focus:ring-offset-black"
                    />
                    <span className="ml-2 text-sm text-white">{option.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="py-2 px-4 vercel-button-secondary"
                >
                  &larr; Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canContinue}
                  className="py-2 px-4 vercel-button-primary disabled:opacity-50"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8 text-center space-y-6">
            <h3 className="text-xl font-medium text-white mb-2">Analyzing your inputs...</h3>
            <div className="flex justify-center my-8 shadow-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
            <div className="bg-[#111] p-4 rounded-md text-left border border-[#333]">
              <p className="text-sm text-[#888] font-medium">Mind has identified your style traits:</p>
              <ul className="mt-2 text-sm text-white space-y-1">
                <li>- Tone: Casual but informative</li>
                <li>- Formatting: Short paragraphs with clear calls to action</li>
                <li>- Platforms: {platforms.map((id) => PLATFORM_OPTIONS.find((option) => option.id === id)?.label).filter(Boolean).join(', ')}</li>
              </ul>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="w-full flex justify-center py-2 px-4 vercel-button-primary mt-4 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Finish & Go to Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
