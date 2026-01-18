import Cerebras from '@cerebras/cerebras_cloud_sdk';
import type { AIService, ChatMessage, CerebrasChunk } from '../types';

if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY environment variable is required');
}

const cerebras = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY
});

const DEFAULT_MODEL = 'gpt-oss-120b';

type CerebrasMessage = 
    | { role: 'system'; content: string }
    | { role: 'user'; content: string }
    | { role: 'assistant'; content?: string | null };

function toCerebrasMessage(msg: ChatMessage): CerebrasMessage {
    switch (msg.role) {
        case 'system':
            return { role: 'system', content: msg.content };
        case 'user':
            return { role: 'user', content: msg.content };
        case 'assistant':
            return { role: 'assistant', content: msg.content };
    }
}

export const cerebrasService: AIService = {
    name: 'Cerebras',
    async chat(messages: ChatMessage[], model: string = DEFAULT_MODEL) {
        const stream = await cerebras.chat.completions.create({
            messages: messages.map(toCerebrasMessage) as CerebrasMessage[],
            model: model || DEFAULT_MODEL,
            stream: true,
            max_completion_tokens: 32768,
            temperature: 1,
            top_p: 1,
            reasoning_effort: "medium"
        });

        return (async function* () {
            for await (const chunk of stream as AsyncIterable<CerebrasChunk>) {
                const choice = chunk.choices?.[0];
                yield choice?.delta?.content || '';
            }
        })()
    }
}
