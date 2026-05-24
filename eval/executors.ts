import { generateText, stepCountIs, tool, type ToolSet } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import type {
  EvalData,
  SingleTurnResult,
  MultiTurnEvalData,
  MultiTurnResult,
} from './types.ts';
import { buildMessages } from './utils.ts';

const TOOL_DEFINITIONS = {
  readFile: {
    description: 'Read the contents of a file at the specified path.',
    parameters: z.object({
      path: z.string().describe('The path to the file to read.'),
    }),
  },
  writeFile: {
    description: 'Write content to a file at the specified path.',
    parameters: z.object({
      path: z.string().describe('The path to the file to write.'),
      content: z.string().describe('The content to write to the file.'),
    }),
  },
  listFiles: {
    description: 'List files in a directory at the specified path.',
    parameters: z.object({
      path: z
        .string()
        .describe('The path to the directory to list files from.'),
    }),
  },
  deleteFile: {
    description: 'Delete a file at the specified path.',
    parameters: z.object({
      path: z.string().describe('The path to the file to delete.'),
    }),
  },
  runCommand: {
    description: 'Run a command in the system shell.',
    parameters: z.object({
      command: z.string().describe('The command to run.'),
    }),
  },
};

export const singleTurnExecutor = async (
  data: EvalData,
): Promise<SingleTurnResult> => {
  const tools: ToolSet = {};
  const messages = buildMessages(data);

  for (const toolName in data.tools) {
    const def = TOOL_DEFINITIONS[toolName as keyof typeof TOOL_DEFINITIONS];

    if (def) {
      tools[toolName] = tool({
        description: def.description,
        inputSchema: def.parameters as any,
      });
    }
  }

  const { toolCalls } = await generateText({
    model: openai(data.config?.model || 'gpt-5.4-nano'),
    messages,
    tools,
    stopWhen: stepCountIs(1),
    temperature: data.config?.temperature ?? undefined,
  });

  const calls = toolCalls.map((call) => ({
    toolName: call.toolName,
    args: 'args' in call ? call.args : {},
  }));

  const toolNames = calls.map((c) => c.toolName);

  return {
    toolCalls: calls,
    toolNames,
    selectedAny: calls.length > 0,
  };
};
