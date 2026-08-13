'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Onboarding() {
  const [step, setStep] = useState(1)

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
                <label className="block text-sm font-medium text-[#888] mb-2">Paste a piece of content you are proud of:</label>
                <textarea
                  rows={5}
                  className="mt-1 block w-full rounded-md bg-[#111] border-[#333] text-white shadow-sm focus:border-white focus:ring-white sm:text-sm p-2 border transition-colors"
                  placeholder="e.g. A recent successful tweet thread or paragraph from a script..."
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full justify-center py-2 px-4 vercel-button-primary"
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
              {/* Dummy checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded bg-[#111] border-[#333] text-white focus:ring-white focus:ring-offset-black" defaultChecked />
                  <span className="ml-2 text-sm text-white">X (Twitter)</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded bg-[#111] border-[#333] text-white focus:ring-white focus:ring-offset-black" defaultChecked />
                  <span className="ml-2 text-sm text-white">LinkedIn</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded bg-[#111] border-[#333] text-white focus:ring-white focus:ring-offset-black" />
                  <span className="ml-2 text-sm text-white">YouTube (Scripts/Descriptions)</span>
                </label>
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
                  className="py-2 px-4 vercel-button-primary"
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
                <li>• Tone: Casual but informative</li>
                <li>• Formatting: Prefers short paragraphs, heavy emoji usage</li>
                <li>• Vocabulary: Accessible tech jargon</li>
              </ul>
            </div>
            <Link
              href="/dashboard"
              className="w-full flex justify-center py-2 px-4 vercel-button-primary mt-4"
            >
              Finish & Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
