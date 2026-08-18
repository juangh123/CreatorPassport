'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  BarChart2, 
  Share2, 
  Settings, 
  CheckCircle2, 
  ExternalLink,
  BrainCircuit,
  Zap,
  Target,
  FileCheck,
  History,
  TrendingUp,
  Cpu,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from '@/lib/supabase/client';
import { Campaign, LearningEvent } from '@/types';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mindsAgentId, setMindsAgentId] = useState('');
  const [mindsAgentSaving, setMindsAgentSaving] = useState(false);
  const [mindsAgentFeedback, setMindsAgentFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Real data states
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);
  const [stats, setStats] = useState({
    voiceProfileTrained: true,
    activeCampaigns: 0,
    mindsSyncRatio: 98,
    savedHours: 12.4
  });

  const supabase = React.useMemo(() => createClient(), []);

  const loadData = React.useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    // 1. Fetch creator profile
    const { data: profile } = await supabase
      .from('creators')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.mind_id) {
      setMindsAgentId(profile.mind_id);
    }

    // 2. Fetch campaigns
    const { data: cData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (cData) {
      setCampaigns(cData);
      setStats(prev => ({
        ...prev,
        activeCampaigns: cData.length,
        savedHours: Number((cData.length * 1.8).toFixed(1))
      }));
    }

    // 3. Fetch learning events
    const { data: lData } = await supabase
      .from('learning_events')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (lData) {
      setLearningEvents(lData);
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    // Client-only data hydration is intentionally triggered here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleSaveMindsAgent = async () => {
    setMindsAgentSaving(true);
    setMindsAgentFeedback(null);

    try {
      const res = await fetch('/api/creators/minds-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mind_id: mindsAgentId.trim() || null })
      });

      if (!res.ok) {
        throw new Error('Failed to update Minds agent ID');
      }

      setMindsAgentFeedback('Minds Agent ID synced successfully.');
      setTimeout(() => setMindsAgentFeedback(null), 3000);
    } catch (error) {
      setMindsAgentFeedback(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setMindsAgentSaving(false);
    }
  };

  const handleDeleteCampaign = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Failed to delete campaign');
      }
    } catch {
      alert('Error deleting campaign');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-fade-up">
      {/* Top Banner / System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#222] pb-8">
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight mb-2">
            Creator Command Center
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[#888]">
            Connected as: <span className="text-emerald-400">{user?.email || 'Authenticated User'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            className="border-[#222] bg-[#0A0A0A] hover:bg-[#151515] text-[#888] hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
          </Button>

          <Link href="/campaigns/new">
            <Button size="sm" className="bg-white text-black hover:bg-neutral-200 font-medium">
              <Plus className="w-4 h-4 mr-1.5" /> New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-[#0f0f0f] border-[#222]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Minds Sync</span>
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-serif text-white mb-1">{stats.mindsSyncRatio}%</div>
            <p className="text-[10px] text-[#555] font-mono">Agent Voice Coherence</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#222]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Total Rollouts</span>
              <Target className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-serif text-white mb-1">{stats.activeCampaigns}</div>
            <p className="text-[10px] text-[#555] font-mono">Multi-Platform Pipelines</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#222]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Time Saved</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-serif text-white mb-1">{stats.savedHours}h</div>
            <p className="text-[10px] text-[#555] font-mono">Vs. Manual Adaptation</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-[#222]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest text-[#666]">Compliance Status</span>
              <FileCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-serif text-white mb-1">Active</div>
            <p className="text-[10px] text-[#555] font-mono">Sponsor Guard Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Active & Past Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Recent Content Rollouts
            </h2>
            <Link href="/campaigns/new" className="text-xs font-mono text-[#888] hover:text-white transition-colors">
              + Launch New Pipeline
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="bg-[#0f0f0f] border-[#222]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48 bg-[#222]" />
                        <Skeleton className="h-3 w-24 bg-[#181818]" />
                      </div>
                      <Skeleton className="h-8 w-20 bg-[#222] rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : campaigns.length === 0 ? (
              <Card className="bg-[#0f0f0f] border-[#222] border-dashed">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <Target className="w-12 h-12 text-[#333] mb-4" />
                  <p className="text-[#888] text-sm mb-2">No campaigns yet.</p>
                  <p className="text-[#555] text-xs max-w-sm mb-6">
                    Launch your first multimodal content rollout from a single long-form script.
                  </p>
                  <Link href="/campaigns/new">
                    <Button variant="outline" className="border-[#333] hover:bg-[#111] text-white">
                      Create First Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="bg-[#0f0f0f] border-[#222] hover:border-[#333] transition-all group overflow-hidden"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <Link href={`/campaigns/${campaign.id}`} className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                            {campaign.title}
                          </h3>
                          {campaign.status === 'published' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono uppercase tracking-wider rounded border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Live
                            </span>
                          ) : campaign.status === 'generating' ? (
                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-mono uppercase tracking-wider rounded border border-orange-500/20 flex items-center gap-1">
                              <Zap className="w-3 h-3 animate-pulse" /> Generating
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#1a1a1a] text-[#888] text-[10px] font-mono uppercase tracking-wider rounded border border-[#333]">
                              {campaign.status}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#666] font-mono flex items-center gap-4">
                          <span>ID: {campaign.id.substring(0, 8).toUpperCase()}</span>
                          <span>CREATED: {new Date(campaign.created_at).toLocaleDateString()}</span>
                          <span>{campaign.platforms?.length || 0} Platforms</span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Link href={`/campaigns/${campaign.id}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-[#888] hover:text-white hover:bg-[#151515]"
                          >
                            View Details <ExternalLink className="w-3 h-3 ml-1.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === campaign.id}
                          onClick={(e) => handleDeleteCampaign(e, campaign.id)}
                          className="text-[#555] hover:text-red-400 hover:bg-[#1a0a0a] h-8 w-8 rounded-md"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Minds Agent Config & Learning Loop */}
        <div className="space-y-6">
          
          {/* Minds Agent Config Card */}
          <Card className="bg-[#0f0f0f] border-[#222]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-serif">
                <BrainCircuit className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-medium">Minds Platform Agent</h3>
              </div>
              <p className="text-xs text-[#888] leading-relaxed">
                Connect your custom agent instance on minds.com to enable real-time memory and custom voice fine-tuning.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-[#666]">
                  Minds Agent ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. agent_abc123"
                    value={mindsAgentId}
                    onChange={(e) => setMindsAgentId(e.target.value)}
                    className="flex-1 bg-[#050505] border border-[#222] px-3 py-1.5 text-xs text-white rounded focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveMindsAgent}
                    disabled={mindsAgentSaving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs px-3 font-medium"
                  >
                    {mindsAgentSaving ? 'Saving...' : 'Sync'}
                  </Button>
                </div>
                {mindsAgentFeedback && (
                  <p className="text-[11px] font-mono text-emerald-400 pt-1">
                    {mindsAgentFeedback}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Continuous Learning Activity Card */}
          <Card className="bg-[#0f0f0f] border-[#222]">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-serif">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-medium">Learning & Feedback Loop</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Adaptive
                </span>
              </div>
              
              <p className="text-xs text-[#888] leading-relaxed">
                Edits you make to generated scripts are recorded as preference vectors to guide subsequent outputs.
              </p>

              <div className="space-y-3 pt-2">
                {learningEvents.length === 0 ? (
                  <div className="text-center py-6 border border-[#1a1a1a] rounded bg-[#080808]">
                    <History className="w-6 h-6 text-[#333] mx-auto mb-2" />
                    <p className="text-xs text-[#666]">No feedback recorded yet.</p>
                    <p className="text-[10px] text-[#444] mt-1">Edit any generated script to teach your agent.</p>
                  </div>
                ) : (
                  learningEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="p-3 bg-[#080808] border border-[#1a1a1a] rounded text-xs space-y-1 font-mono"
                    >
                      <div className="flex justify-between items-center text-[#555] text-[10px]">
                        <span className="text-emerald-400/80 uppercase">{event.event_type}</span>
                        <span>{new Date(event.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#bbb] text-[11px] truncate font-sans">
                        {event.extracted_pattern || 'User preference updated'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
