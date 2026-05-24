// biome-ignore assist/source/organizeImports: <explanation>
import 'dotenv/config';
import { generateText, type ModelMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getTracer, Laminar } from '@lmnr-ai/lmnr';

import { SYSTEM_PROMPT } from './system/prompt.ts';
import type { AgentCallbacks } from '../types.ts';
import { tools } from './tools/index.ts';

const MODEL_NAME = 'gpt-5.4-nano';

Laminar.initialize({
  projectApiKey: process.env.LMNR_PROJECT_API_KEY || '',
});

export const runAgent = async (
  userMessage: string,
  conversationHistory?: ModelMessage[],
  callbacks?: AgentCallbacks,
): Promise<any> => {
  const { text } = await generateText({
    model: openai(MODEL_NAME),
    prompt: userMessage,
    system: SYSTEM_PROMPT,
    tools,
    experimental_telemetry: {
      isEnabled: true,
      tracer: getTracer(),
    },
  });

  await Laminar.flush();

  console.log('Agent response:', text);
};
