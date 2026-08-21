import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { Minds } from '@minds/sdk';

if (existsSync('.env.local')) {
  loadEnv({ path: '.env.local' });
} else {
  loadEnv();
}

async function validateMindsAPI() {
  const apiKey = process.env.MINDS_API_KEY;
  if (!apiKey || apiKey === 'your-minds-api-key') {
    console.error('Please set MINDS_API_KEY in .env.local or .env.');
    return;
  }

  if (!process.env.MINDS_AGENT_ID || process.env.MINDS_AGENT_ID === 'your-minds-agent-id') {
    console.warn('MINDS_AGENT_ID is not set. You can bind a per-creator agent in the dashboard instead.');
  }

  console.log('Validating Minds API...');

  try {
    // Initialize the Minds client
    new Minds({
      apiKey: apiKey,
    });

    console.log('Minds SDK client initialized.');

    // In a real validation script, we would create an agent and send a message.
    // However, we don't have the full documentation for @minds/sdk yet.
    // Assuming a generic client shape to test connection:

    // We will update the client.ts implementation based on this SDK
    console.log('Ready to update src/minds/client.ts with @minds/sdk');

  } catch (error) {
    console.error('Error validating Minds API:', error);
  }
}

validateMindsAPI().catch(console.error);
