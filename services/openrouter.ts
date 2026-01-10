import { OpenRouter } from "@openrouter/sdk";
import type { AIService, ChatMessage } from '../types';

const openrouter = new OpenRouter();

export const openrouterService: AIService = {
    name: 'OpenRouter',
    async chat(messages: ChatMessage[]) {
        const stream = await openrouter.chat.send({
            messages,
            model: "xiaomi/mimo-v2-flash:free",
            stream: true
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield (chunk as any).choices[0]?.delta?.content || '';
            }
        })();        
    }   
}