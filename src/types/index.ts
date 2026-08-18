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
  final_text?: string;
  feedback?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'published' | 'replaced';
  consistency_checks?: {
    compliant: boolean;
    missing: string[];
    violations: string[];
  };
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

export interface LearningEvent {
  id: string;
  creator_id: string;
  event_type: string;
  original_text?: string;
  modified_text?: string;
  context?: string;
  extracted_pattern?: string;
  applied_to_campaigns?: string[];
  created_at: string;
}
