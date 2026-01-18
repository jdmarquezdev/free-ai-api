import { OpenRouter } from "@openrouter/sdk";
import type { AIService, ChatMessage } from '../types';

if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
}

const openrouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
});

const DEFAULT_MODEL = 'xiaomi/mimo-v2-flash:free';

export const openrouterService: AIService = {
    name: 'OpenRouter',
    async chat(messages: ChatMessage[], model: string = DEFAULT_MODEL) {
        const stream = await openrouter.chat.send({
            messages,
            model: model || DEFAULT_MODEL,
            stream: true
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield (chunk as any).choices[0]?.delta?.content || '';
            }
        })();        
    }   
}