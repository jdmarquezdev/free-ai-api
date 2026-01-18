import { Groq } from 'groq-sdk';
import type { AIService, ChatMessage } from '../types';

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const DEFAULT_MODEL = 'moonshotai/kimi-k2-instruct-0905';

export const groqService: AIService = {
    name: 'Groq',
    async chat(messages: ChatMessage[], model: string = DEFAULT_MODEL) {        
        const chatCompletion = await groq.chat.completions.create({
        messages,
        "model": model || DEFAULT_MODEL,
        "temperature": 0.6,
        "max_completion_tokens": 4096,
        "top_p": 1,
        "stream": true,
        "stop": null
        });

        return (async function* () {
            for await (const chunk of chatCompletion) {
                yield chunk.choices[0]?.delta?.content || '';
            }
        })()
    }
}