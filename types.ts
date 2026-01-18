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

export interface CerebrasChunkChoice {
    index: number;
    delta?: {
        content?: string | null;
        reasoning?: string | null;
        role?: 'assistant' | 'user' | 'system' | 'tool' | null;
        tokens?: number[] | null;
        tool_calls?: unknown[] | null;
    } | null;
    finish_reason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
    logprobs?: unknown;
}

export interface CerebrasChunk {
    id: string;
    created: number;
    model: string;
    object: 'chat.completion.chunk' | 'text_completion';
    system_fingerprint: string;
    choices?: CerebrasChunkChoice[] | null;
}

export interface OpenRouterStreamingChoice {
    delta: {
        role?: 'assistant';
        content?: string | null;
        reasoning?: string | null;
        refusal?: string | null;
        tool_calls?: unknown;
    };
    finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
    index: number;
    logprobs?: unknown;
}

export interface OpenRouterStreamingChunk {
    id: string;
    choices: OpenRouterStreamingChoice[];
    created: number;
    model: string;
    object: 'chat.completion.chunk';
    systemFingerprint?: string | null;
}