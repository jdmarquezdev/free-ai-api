import "dotenv/config";
import { cerebrasService } from "./services/cerebras";
import { groqService } from "./services/groq";
import { openrouterService } from "./services/openrouter";
import type { AIService, ChatMessage, OpenAIChatCompletionRequest } from "./types";

const services: AIService[] = [
    groqService,
    cerebrasService,
    openrouterService
]
let currentServiceIndex = 0;

const MODEL_TO_SERVICE: Record<string, AIService> = {
    'moonshotai': groqService,
    'gpt-oss-120b': cerebrasService,
    'xiaomi': openrouterService
};

function getServiceForModel(model?: string): { service: AIService; model: string | undefined } {
    if (model) {
        for (const prefix of Object.keys(MODEL_TO_SERVICE)) {
            if (model.startsWith(prefix)) {
                const service = MODEL_TO_SERVICE[prefix];
                if (service) return { service, model };
            }
        }
    }

    const service = services[currentServiceIndex];
    if (!service) throw new Error('No services available');
    currentServiceIndex = (currentServiceIndex + 1) % services.length;
    return { service, model: undefined };
}

function generateId(): string {
    return 'chatcmpl-' + Math.random().toString(36).substring(2, 15);
}

async function* streamWithOpenAIFormat(
    stream: AsyncIterable<string>,
    request: OpenAIChatCompletionRequest
): AsyncGenerator<string> {
    const id = generateId();
    const created = Math.floor(Date.now() / 1000);
    const model = request.model || 'unknown';

    let content = '';
    let firstChunk = true;

    for await (const chunk of stream) {
        content += chunk;
        
        const chunkData = {
            id,
            object: 'chat.completion.chunk',
            created,
            model,
            system_fingerprint: 'fp_' + Math.random().toString(36).substring(2, 10),
            choices: [{
                index: 0,
                delta: {
                    role: firstChunk ? 'assistant' : undefined,
                    content: chunk
                },
                finish_reason: null,
                logprobs: null
            }],
            usage: undefined
        };

        firstChunk = false;
        yield `data: ${JSON.stringify(chunkData)}\n\n`;
    }

    const finalChunk = {
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        system_fingerprint: 'fp_' + Math.random().toString(36).substring(2, 10),
        choices: [{
            index: 0,
            delta: {},
            finish_reason: 'stop',
            logprobs: null
        }],
        usage: request.stream_options?.include_usage ? {
            prompt_tokens: 0,
            completion_tokens: content.length,
            total_tokens: content.length
        } : undefined
    };

    yield `data: ${JSON.stringify(finalChunk)}\n\n`;
    yield 'data: [DONE]\n\n';
}

const server = Bun.serve({
    port: process.env.PORT ?? 3000,
    async fetch(req) {
        const {pathname} = new URL(req.url);

        if (req.method === 'POST' && pathname === '/v1/chat/completions') {
            let requestBody: Record<string, unknown>;
            try {
                requestBody = await req.json() as Record<string, unknown>;
            } catch {
                return new Response(JSON.stringify({
                    error: {
                        message: 'Invalid JSON in request body',
                        type: 'invalid_request_error'
                    }
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
                return new Response(JSON.stringify({
                    error: {
                        message: 'messages is required and must be an array',
                        type: 'invalid_request_error'
                    }
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const request: OpenAIChatCompletionRequest = {
                messages: requestBody.messages as ChatMessage[],
                model: (requestBody.model as string) || undefined,
                temperature: requestBody.temperature as number | undefined,
                max_tokens: requestBody.max_tokens as number | undefined,
                stream: (requestBody.stream as boolean) ?? true,
                stream_options: requestBody.stream_options as { include_usage?: boolean } | undefined,
                user: requestBody.user as string | undefined
            };

            try {
                const { service, model } = getServiceForModel(request.model);
                console.log(`Using service: ${service.name}`);

                const stream = await service.chat(request.messages, model);

                if (!stream) {
                    return new Response(JSON.stringify({
                        error: {
                            message: 'Failed to get stream from service',
                            type: 'internal_error'
                        }
                    }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                if (!request.stream) {
                    let content = '';
                    for await (const chunk of stream) {
                        content += chunk;
                    }
                    const id = generateId();
                    const completion = {
                        id,
                        object: 'chat.completion',
                        created: Math.floor(Date.now() / 1000),
                        model: request.model || 'unknown',
                        choices: [{
                            index: 0,
                            message: {
                                role: 'assistant',
                                content
                            },
                            finish_reason: 'stop',
                            logprobs: null
                        }],
                        usage: {
                            prompt_tokens: 0,
                            completion_tokens: content.length,
                            total_tokens: content.length
                        }
                    };
                    return new Response(JSON.stringify(completion), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                const openAIStream = streamWithOpenAIFormat(stream, request);

                return new Response((async function*() {
                    for await (const chunk of openAIStream) {
                        yield chunk;
                    }
                })(), {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    }
                });
            } catch (error) {
                console.error('Error processing request:', error);
                return new Response(JSON.stringify({
                    error: {
                        message: 'Internal server error',
                        type: 'internal_error'
                    }
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        if (req.method === 'GET' && pathname === '/v1/models') {
            return new Response(JSON.stringify({
                object: 'list',
                data: [
                    {
                        id: 'moonshotai/kimi-k2-instruct-0905',
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: 'Groq'
                    },
                    {
                        id: 'gpt-oss-120b',
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: 'Cerebras'
                    },
                    {
                        id: 'xiaomi/mimo-v2-flash:free',
                        object: 'model',
                        created: Math.floor(Date.now() / 1000),
                        owned_by: 'OpenRouter'
                    }
                ]
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (req.method === 'POST' && pathname === '/chat') {
            const body = await req.json() as { messages: ChatMessage[] };
            const { messages } = body;
            const { service, model } = getServiceForModel(undefined);

            console.log(`Using service: ${service.name}`);
            const stream = await service.chat(messages, model);

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        }
        
        return new Response("Not found", { status: 404 });        
    }
})

console.log(`Server is running on ${server.url}:${server.port}`);