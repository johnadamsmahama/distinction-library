import Anthropic from '@anthropic-ai/sdk';

// SERVER-ONLY. Used by app/api/vault/generate-quiz and app/api/vault/companion.
let client: Anthropic | null = null;

export function getAnthropicClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return client;
}

// The model used across both AI features. Centralised so it's a one-line
// change if you want to upgrade/downgrade later.
export const CLAUDE_MODEL = 'claude-sonnet-4-5';
