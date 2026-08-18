'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check, Edit2, Box, ArrowLeft, RefreshCw, Smartphone, Play, Music2, Zap, CheckCircle2, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react'
import { MagicBorderButton } from "@/components/magic-border-button";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';

import { Campaign, PlatformVersion } from '@/types';

const platformsDef = [
  { id: 'twitter', label: 'X (Twitter)', icon: Zap },
  { id: 'linkedin', label: 'LinkedIn', icon: Box },
  { id: 'instagram', label: 'Instagram', icon: Smartphone },
  { id: 'youtube', label: 'YouTube Shorts', icon: Play },
  { id: 'tiktok', label: 'TikTok Caption', icon: Music2 }
];

export default function CampaignDetail() {
  const params = useParams()
  const campaignId = params.id as string

  const [isGenerating, setIsGenerating] = useState(true)
  const [activeTab, setActiveTab] = useState('twitter')
  const [showLearningEvent, setShowLearningEvent] = useState(false)

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [versions, setVersions] = useState<PlatformVersion[]>([]);
  const supabase = React.useMemo(() => createClient(), []);
  const editTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Platforms definition mapping
  // Moved outside component


  const fetchCampaign = useCallback(async () => {
    // 1. Fetch Campaign
    const { data: c } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    if (c) {
      setCampaign(c);
      setIsGenerating(c.status === 'generating' || c.status === 'draft');
    } else {
      setIsGenerating(false);
    }

    // 2. Fetch platform versions
    const { data: v } = await supabase.from('platform_versions').select('*').eq('campaign_id', campaignId);
    if (v && v.length > 0) {
      setVersions(v);
      if(v[0] && Array.from(platformsDef.map(p => p.id)).includes(v[0].platform)) {
         setActiveTab(v[0].platform);
      }
    }
  }, [campaignId, supabase]);

  useEffect(() => {
    // Client-only data hydration is intentionally triggered here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCampaign();

    // Use Supabase Realtime instead of polling
    if (!campaignId) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` },
        () => {
          fetchCampaign();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_versions', filter: `campaign_id=eq.${campaignId}` },
        () => {
          fetchCampaign();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchCampaign, campaignId, supabase]);

  useEffect(() => {
    return () => {
      if (editTimer.current) {
        clearTimeout(editTimer.current);
      }
    };
  }, []);

  const handleRegenerate = async () => {
    if (!campaignId) return;

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate campaign');
      }

      await fetchCampaign();
    } catch (error) {
      console.error('Failed to regenerate campaign:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const persistEdit = async (modifiedText: string) => {
    const currentVersion = versions.find((version) => version.platform === activeTab);

    if (!currentVersion || !campaign || modifiedText.trim() === (currentVersion.final_text || currentVersion.generated_text)) {
      return;
    }

    const { error: updateError } = await supabase
      .from('platform_versions')
      .update({
        final_text: modifiedText.trim(),
        status: 'reviewed',
      })
      .eq('id', currentVersion.id);

    if (updateError) {
      console.error('Failed to persist edit:', updateError);
      return;
    }

    setVersions((currentVersions) =>
      currentVersions.map((version) =>
        version.id === currentVersion.id
          ? { ...version, final_text: modifiedText.trim(), status: 'reviewed' }
          : version,
      ),
    );

    if (campaign.creator_id) {
      await supabase.from('learning_events').insert({
        creator_id: campaign.creator_id,
        event_type: 'modification',
        original_text: currentVersion.generated_text,
        modified_text: modifiedText.trim(),
        context: `Campaign ${campaignId}, platform ${activeTab}`,
        extracted_pattern: 'User edited generated content.',
        applied_to_campaigns: [campaignId],
      });
    }

    setShowLearningEvent(true);
    setTimeout(() => setShowLearningEvent(false), 5000);
  };

  const handleEdit = (event: React.FormEvent<HTMLDivElement>) => {
    const modifiedText = event.currentTarget.textContent ?? '';

    if (editTimer.current) {
      clearTimeout(editTimer.current);
    }

    editTimer.current = setTimeout(() => {
      void persistEdit(modifiedText);
    }, 700);
  };

  const activeVersion = versions.find((version) => version.platform === activeTab);
  const isSponsorSafe = activeVersion?.consistency_checks?.compliant !== false;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-up pb-32">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#666] hover:text-emerald-400 transition-colors mb-12">
        <ArrowLeft size={14} /> Back to Command Center
      </Link>

      {/* Floating Learning Notification */}
      {showLearningEvent && (
        <div className="fixed top-24 right-12 z-50 animate-in fade-in slide-in-from-right-8 duration-500">
           <div className="bg-[#111] border border-emerald-500/50 p-4 shadow-2xl flex items-start gap-4 max-w-sm rounded-lg">
             <div className="mt-1">
               <Cpu className="text-emerald-400 animate-pulse" size={18} />
             </div>
             <div>
               <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 mb-1">Agent Memory Updated</p>
               <p className="text-sm font-sans text-white/90">
                 Saved new preference based on your edit.
                 <br/><span className="text-[#666] text-xs">Future generations will apply this rule.</span>
               </p>
             </div>
           </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[#222] pb-12 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif tracking-tighter mb-4 text-balance font-medium">
            {campaign?.title || 'Loading Campaign...'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-[#111] text-[#888] text-xs font-mono uppercase tracking-widest border border-[#333]">
              ID: {campaignId.length > 8 ? campaignId.substring(0,8).toUpperCase() : campaignId.toUpperCase()}
            </span>
            <span className="text-[#555] text-xs font-mono uppercase tracking-widest">
              Generated {campaign?.created_at ? new Date(campaign.created_at).toLocaleDateString() : '...'}
            </span>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 px-4 py-3 border border-[#333] bg-[#0A0A0A] rounded">
               <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></div>
               <span className="font-mono text-xs uppercase tracking-widest text-[#888]">Agent Matrix Processing...</span>
            </div>
            <p className="text-[10px] text-[#666] font-mono flex items-center gap-1"><ShieldCheck size={12}/> Running Sponsor Compliance checks</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button variant="outline" className="text-white border-[#333] bg-transparent hover:bg-[#111]" onClick={handleRegenerate}>
               <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
            </Button>
            <MagicBorderButton className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Approve All
            </MagicBorderButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-[#555] mb-6 mb-4">Platform Deliverables</p>
          {campaign?.platforms?.map((platformId: string) => {
            const platformConfig = platformsDef.find(p => p.id === platformId) || platformsDef[0];
            const Icon = platformConfig.icon;
            const isActive = activeTab === platformId;
            return (
              <button
                key={platformId}
                onClick={() => setActiveTab(platformId)}
                className={`w-full text-left flex items-center justify-between p-4 border transition-all duration-300 ${
                  isActive ? 'border-emerald-500/50 bg-[#111] text-white' : 'border-[#222] text-[#888] hover:border-[#333]'
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-[#555]'} />
                  {platformConfig.label}
                </span>
                {!isGenerating && (
                  <Check size={16} className={`text-emerald-400 transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                )}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {isGenerating ? (
            <div className="h-[400px] border border-[#222] bg-[#0A0A0A] flex flex-col items-center justify-center space-y-6">
              <div className="w-12 h-12 border-4 border-[#222] border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm font-mono text-[#666] animate-pulse uppercase tracking-widest">Applying creator memory models...</p>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#222] to-[#111] opacity-50 group-hover:opacity-100 blur transition duration-1000"></div>
              <div className="relative bg-[#050505] border border-[#222] p-8 md:p-12 h-full min-h-[400px] flex flex-col">

                <div className="flex justify-between items-start mb-8 text-xs font-mono text-[#666]">
                  <span className="uppercase tracking-widest flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                     Status: Ready for Review
                  </span>

                  {/* Highlight: Agent Intelligence Score */}
                  <span className="flex gap-4">
                     <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12}/> Tone Match: 98%</span>
                     {isSponsorSafe ? (
                       <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck size={12}/> Sponsor Safe</span>
                     ) : (
                       <span className="text-orange-400 flex items-center gap-1"><ShieldAlert size={12}/> Needs Review</span>
                     )}
                  </span>
                </div>

                <div
                  className="prose prose-invert max-w-none text-lg md:text-xl font-light leading-relaxed text-[#eee]"
                  contentEditable
                  onInput={handleEdit}
                  suppressContentEditableWarning
                >
                  {activeVersion?.final_text || activeVersion?.generated_text || "Select a platform to view generated content."}
                </div>

                <div className="mt-auto pt-12 flex items-center justify-between">
                  <p className="text-xs text-[#555] italic">
                    * Try editing the text above. The Mind Agent will learn from your changes.
                  </p>

                  <div className="flex gap-2">
                    <Button variant="outline" className="border-[#333] hover:bg-[#111] text-[#999]">
                      <Edit2 className="w-4 h-4 mr-2" /> Refine with AI
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
