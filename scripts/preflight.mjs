import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Minds } from '@minds/sdk';

const envPath = '.env.local';

if (existsSync(envPath)) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

const results = [];

function record(name, ok, detail = '') {
  const status = ok ? 'PASS' : 'WARN';
  results.push({ name, ok, detail });
  console.log(`[${status}] ${name}${detail ? ` - ${detail}` : ''}`);
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0 && value !== 'your-project-url' && value !== 'your-anon-key' && value !== 'your-minds-api-key' && value !== 'your-minds-agent-id';
}

function withTimeout(promise, ms, label) {
  let timer;

  return new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const mindsApiKey = process.env.MINDS_API_KEY;

record('NEXT_PUBLIC_SUPABASE_URL', hasValue(supabaseUrl));
record('NEXT_PUBLIC_SUPABASE_ANON_KEY', hasValue(supabaseAnonKey));
record('MINDS_API_KEY', hasValue(mindsApiKey));

if (process.env.MINDS_AGENT_ID && hasValue(process.env.MINDS_AGENT_ID)) {
  record('MINDS_AGENT_ID', true, 'environment fallback configured');
} else {
  record('MINDS_AGENT_ID', false, 'not set; bind an agent in the dashboard before demo');
}

if (hasValue(supabaseUrl) && hasValue(supabaseAnonKey)) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  for (const table of ['creators', 'campaigns', 'platform_versions', 'follow_up_tasks', 'learning_events']) {
    try {
      const { error } = await withTimeout(
        supabase.from(table).select('id', { head: true, count: 'exact' }),
        8000,
        `Supabase ${table}`,
      );

      record(`Supabase table ${table}`, !error, error ? error.message : 'reachable');
    } catch (error) {
      record(`Supabase table ${table}`, false, error instanceof Error ? error.message : 'unknown error');
    }
  }
} else {
  record('Supabase table probe', false, 'skipped because Supabase env is missing');
}

if (hasValue(mindsApiKey)) {
  try {
    const minds = new Minds({ apiKey: mindsApiKey });
    record('Minds client initialization', true);

    try {
      const response = await withTimeout(minds.agents.list({ limit: 1 }), 10000, 'Minds agents list');
      const count = Array.isArray(response?.data) ? response.data.length : null;
      record('Minds agents list', true, count === null ? 'reachable' : `${count} agent(s) returned`);
    } catch (error) {
      record('Minds agents list', false, error instanceof Error ? error.message : 'unknown error');
    }
  } catch (error) {
    record('Minds client initialization', false, error instanceof Error ? error.message : 'unknown error');
  }
} else {
  record('Minds client initialization', false, 'skipped because MINDS_API_KEY is missing');
}

const failed = results.filter((result) => !result.ok).length;
console.log(`\nPreflight complete: ${results.length - failed} passed, ${failed} warnings.`);

if (failed > 0) {
  process.exitCode = 1;
}
