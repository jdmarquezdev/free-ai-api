export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIService {
    name: string;
    chat(messages: ChatMessage[], model?: string): Promise<AsyncIterable<string>>;
}

export interface OpenAIChatCompletionRequest {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    stream_options?: {
        include_usage?: boolean;
    };
    user?: string;
}

export interface OpenAIChatCompletionChunk {
    id: string;
    object: 'chat.completion.chunk';
    created: number;
    model: string;
    system_fingerprint: string;
    choices: {
        index: number;
        delta: {
            role?: string;
            content?: string;
        };
        finish_reason: string | null;
        logprobs: unknown;
    }[];
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}