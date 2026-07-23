import "server-only";
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openai(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

/** Hard per-call output caps to control cost. */
export const TOKEN_CAPS = {
  dailyCard: 700,
  tarot: 500,
  chat: 450,
  insight: 200,
} as const;
