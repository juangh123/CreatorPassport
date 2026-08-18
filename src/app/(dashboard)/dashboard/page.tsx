'use client';

import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, CheckCircle2, Plus, Activity, Zap, BrainCircuit, Clock, Target } from 'lucide-react'

import { SpotlightCard } from "@/components/spotlight-card";
import { MagicBorderButton } from "@/components/magic-border-button";

import { Campaign } from '@/types';

interface Task {
  id: string;
  description: string;
  status: string;
  task_type: string;
}

interface LearningEvent {
  id: string;
  extracted_pattern: string | null;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mindId, setMindId] = useState('');
  const [savedMindId, setSavedMindId] = useState('');
  const [savingMindId, setSavingMindId] = useState(false);
  const [creatorName, setCreatorName] = useState('');
  const [platformCount, setPlatformCount] = useState(0);
  const [learnings, setLearnings] = useState<LearningEvent[]>([]);
  const supabase = React.useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      // Fetch real campaigns from Supabase
      const { data: camps, error: campErr } = await supabase
        .from('campaigns')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(5);

      if (camps && !campErr) {
        setCampaigns(camps);
      }

      // Fetch follow up tasks (we'll inject dummy tasks if empty, just for demo purposes to show Mind Task Queue)
      const { data: tks, error: tkErr } = await supabase
        .from('follow_up_tasks')
        .select('*')
        .order('scheduled_at', { ascending: true })
        .limit(3);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setCreatorName(user.email?.split('@')[0] || 'Creator');

        const { data: creator } = await supabase
          .from('creators')
          .select('email, mind_id, voice_profile')
          .eq('id', user.id)
          .single();

        if (creator?.mind_id) {
          setMindId(creator.mind_id);
          setSavedMindId(creator.mind_id);
        }

        const savedPlatforms = Array.isArray(creator?.voice_profile?.platforms)
          ? creator.voice_profile.platforms
          : [];

        if (savedPlatforms.length > 0) {
          setPlatformCount(savedPlatforms.length);
        }
      }

      const { data: learningEvents } = await supabase
        .from('learning_events')
        .select('id, extracted_pattern')
        .order('created_at', { ascending: false })
        .limit(3);

      if (learningEvents) {
        setLearnings(learningEvents);
      }

      if (tks && !tkErr) {
        setTasks(tks);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Client-only data hydration is intentionally triggered here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const saveMindId = async () => {
    const nextMindId = mindId.trim();
    if (!nextMindId || nextMindId === savedMindId) return;

    setSavingMindId(true);

    try {
      const response = await fetch('/api/creators/minds-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: nextMindId }),
      });

      if (!response.ok) {
        throw new Error('Failed to bind Minds agent');
      }

      setSavedMindId(nextMindId);
    } catch (error) {
      console.error(error);
      alert('Failed to save Minds Agent ID.');
    } finally {
      setSavingMindId(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-10 max-w-6xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-light tracking-tight text-white">Welcome back, {creatorName || 'Creator'}</h1>
          <p className="text-[#888] text-sm">Your Mind is active and monitoring {platformCount || 0} platforms.</p>
        </div>
        <Link href="/campaigns/new">
          <MagicBorderButton className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </MagicBorderButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. Mind Brain State Activity & Tasks Queue */}
        <div className="md:col-span-1 space-y-6">
          {/* Brain State */}
           <SpotlightCard className="p-6 bg-[#0a0a0a] border border-[#222]">
            <div className="flex items-start justify-between mb-4">
               <div>
                  <h2 className="text-sm font-medium text-[#ccc] uppercase tracking-wider flex items-center gap-2">
                     <BrainCircuit className="w-4 h-4 text-emerald-400" />
                     Mind State
                  </h2>
                  <p className="text-xs text-[#666] mt-1">Real-time creator profile</p>
               </div>
               <div className="flex items-center gap-2 bg-[#111] px-2 py-1 rounded text-xs border border-[#333]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active
               </div>
            </div>

            <div className="mt-4 space-y-2">
               <label htmlFor="mind-agent-id" className="block text-xs uppercase tracking-widest text-[#666]">Minds Agent ID</label>
               <input
                 id="mind-agent-id"
                 type="text"
                 value={mindId}
                 onChange={(event) => setMindId(event.target.value)}
                 placeholder="Paste a Minds agent ID"
                 className="w-full rounded bg-[#111] border border-[#333] px-3 py-2 text-sm text-white placeholder-[#555] outline-none focus:border-emerald-500/60"
               />
               <Button
                 type="button"
                 onClick={saveMindId}
                 disabled={savingMindId || !mindId.trim() || mindId.trim() === savedMindId}
                 className="w-full"
               >
                 {savingMindId ? 'Saving...' : savedMindId ? 'Update Agent' : 'Save Agent'}
               </Button>
             </div>

             <div className="space-y-3 mt-6">
               <div className="bg-[#111] border border-[#2a2a2a] p-3 rounded text-sm text-[#999] flex justify-between items-center">
                  <span>Configured Platforms</span>
                  <span className="text-emerald-400 font-mono">{platformCount}</span>
               </div>
               <div className="bg-[#111] border border-[#2a2a2a] p-3 rounded text-sm text-[#999] space-y-2">
                  <span className="block text-xs uppercase text-[#666]">Recent Learnings (Memory)</span>
                  <ul className="text-xs space-y-2 text-[#aaa]">
                     {learnings.length === 0 ? (
                       <li className="text-[#666]">No learnings yet.</li>
                     ) : (
                       learnings.map((learning) => (
                         <li key={learning.id} className="flex items-start gap-2">
                           <Zap className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                           {learning.extracted_pattern || 'Memory updated'}
                         </li>
                       ))
                     )}
                   </ul>
               </div>
            </div>
          </SpotlightCard>

          {/* Automated Task Queue */}
           <SpotlightCard className="p-6 bg-[#0a0a0a] border border-[#222]">
            <div className="flex items-start justify-between mb-4">
               <div>
                  <h2 className="text-sm font-medium text-[#ccc] uppercase tracking-wider flex items-center gap-2">
                     <Activity className="w-4 h-4 text-orange-400" />
                     Mind Task Queue
                  </h2>
                  <p className="text-xs text-[#666] mt-1">Automated execution</p>
               </div>
            </div>

            <div className="space-y-3 mt-4">
              {loading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-12 w-full bg-[#222]" />
                    <Skeleton className="h-12 w-full bg-[#222]" />
                 </div>
              ) : tasks.length === 0 ? (
                 <div className="text-sm text-[#666] py-4 text-center">No background tasks</div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-[#111] border border-[#2a2a2a] p-3 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <span className="text-xs text-white leading-relaxed">{task.description}</span>
                       {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                       ) : (
                          <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                       )}
                    </div>
                    <div className="text-[10px] uppercase text-[#666] flex justify-between">
                       <span>{task.task_type.replace(/_/g, ' ')}</span>
                       <span className={task.status === 'completed' ? 'text-emerald-500/70' : 'text-orange-400/70'}>{task.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>
        </div>

        {/* 2. Recent Campaigns */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              Recent Campaigns
            </h2>
            <Button variant="ghost" size="sm" className="text-[#888] hover:text-white">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="bg-[#0f0f0f] border-[#222] overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48 bg-[#222]" />
                        <Skeleton className="h-4 w-32 bg-[#222]" />
                      </div>
                      <Skeleton className="h-10 w-24 bg-[#222] rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : campaigns.length === 0 ? (
               <Card className="bg-[#0f0f0f] border-[#222] overflow-hidden border-dashed">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                     <Target className="w-12 h-12 text-[#333] mb-4" />
                     <p className="text-[#888] text-sm">No campaigns yet. Start your first multimodal content rollout.</p>
                     <Link href="/campaigns/new" className="mt-6">
                        <Button variant="outline" className="border-[#333] hover:bg-[#111]">Create Campaign</Button>
                     </Link>
                  </CardContent>
               </Card>
            ) : (
               campaigns.map((campaign) => (
              <Card key={campaign.id} className="bg-[#0f0f0f] border-[#222] overflow-hidden hover:border-[#333] transition-colors group">
                <CardContent className="p-0">
                  <Link href={`/campaigns/${campaign.id}`} className="block p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                      {/* Left: Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors">
                            {campaign.title}
                          </h3>
                          {campaign.status === 'published' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-mono tracking-wider rounded border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Live
                            </span>
                          ) : campaign.status === 'generating' ? (
                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] uppercase font-mono tracking-wider rounded border border-orange-500/20 flex items-center gap-1">
                              <Zap className="w-3 h-3" /> Generating
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#222] text-[#888] text-[10px] uppercase font-mono tracking-wider rounded border border-[#333]">
                              {campaign.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#666] font-mono flex items-center gap-4">
                          <span>ID: {campaign.id.substring(0, 8).toUpperCase()}</span>
                          <span>CREATED: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Right: Action */}
                      <div className="flex items-center gap-3">
                         <div className="text-xs text-[#888] flex gap-2">
                           <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#111] border border-[#222]">X</span>
                           <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#111] border border-[#222]">in</span>
                           <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#111] border border-[#222]">Ig</span>
                         </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full bg-[#111] border border-[#222] text-[#888] group-hover:bg-white group-hover:text-black group-hover:border-white transition-all"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
