export interface Campaign {
  id: string;
  creator_id?: string;
  title: string;
  source_text?: string;
  sponsor_brief?: Record<string, unknown>;
  platforms?: string[];
  deadline?: string;
  status: 'draft' | 'generating' | 'reviewing' | 'complete' | 'published';
  created_at: string;
  updated_at?: string;
}

export interface PlatformVersion {
  id: string;
  campaign_id: string;
  platform: string;
  generated_text: string;
  feedback?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'published' | 'replaced';
  created_at: string;
}

export interface Creator {
  id: string;
  email: string | null;
  mind_id?: string;
  mind_email?: string;
  voice_profile?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
