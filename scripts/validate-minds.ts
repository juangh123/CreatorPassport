import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import {
  BUILDER_API_KEY_ENV,
  createMindsClient,
} from '@animocabrands/minds-client-lib';

if (existsSync('.env.local')) {
  loadEnv({ path: '.env.local' });
} else {
  loadEnv();
}

async function validateMindsAPI() {
  const apiKey = process.env[BUILDER_API_KEY_ENV] || process.env.MINDS_API_KEY;
  if (!apiKey || apiKey === 'your-minds-builder-api-key') {
    console.error('Please set MINDS_BUILDER_API_KEY in .env.local or .env.');
    return;
  }

  if (!process.env.MINDS_AGENT_ID || process.env.MINDS_AGENT_ID === 'your-minds-agent-id') {
    console.warn('MINDS_AGENT_ID is not set. You can bind a per-creator agent in the dashboard instead.');
  }

  console.log('Validating Minds API...');

  try {
    const client = createMindsClient({ builderApiKey: apiKey });

    const minds = await client.listMinds();
    console.log(`Minds Builder API connected: ${minds.length} Mind(s) found.`);

    const agentId = process.env.MINDS_AGENT_ID;
    const matchedMind = agentId
      ? minds.find((mind) => mind.mindId === agentId)
      : minds[0];

    if (!matchedMind) {
      console.warn('No matching Mind found for MINDS_AGENT_ID.');
      return;
    }

    console.log(`Using Mind: ${matchedMind.name ?? 'Unnamed'} (${matchedMind.mindId}).`);
  } catch (error) {
    console.error('Error validating Minds API:', error);
  }
}

validateMindsAPI().catch(console.error);
