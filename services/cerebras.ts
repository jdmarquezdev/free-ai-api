import Cerebras from '@cerebras/cerebras_cloud_sdk';
import type { AIService, ChatMessage } from '../types';

if (!process.env.CEREBRAS_API_KEY) {
    throw new Error('CEREBRAS_API_KEY environment variable is required');
}

const cerebras = new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY
});

const DEFAULT_MODEL = 'gpt-oss-120b';

export const cerebrasService: AIService = {
    name: 'Cerebras',
    async chat(messages: ChatMessage[], model: string = DEFAULT_MODEL) {
        const stream = await cerebras.chat.completions.create({
            messages: messages as any,
            model: model || DEFAULT_MODEL,
            stream: true,
            max_completion_tokens: 32768,
            temperature: 1,
            top_p: 1,
            reasoning_effort: "medium"
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield (chunk as any).choices[0]?.delta?.content || '';
            }
        })()        
    }
}
