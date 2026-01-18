# AGENTS.md

This file provides guidelines for AI agents working in this repository.

## Build, Lint, and Test Commands

### Install Dependencies
```bash
bun install
```

### Run Server (development)
```bash
bun run dev
```
Starts the server with hot reload on `http://localhost:3000`

### Run Server (production)
```bash
bun run index.ts
# or
bun start
```

### Type Checking
```bash
# Bun doesn't have a separate type-check command
# Type errors will be shown when running the server
bun run index.ts
```

### No Test Suite
This project does not have a test suite configured.

## Code Style Guidelines

### General Principles
- Write clean, self-documenting code
- Prefer explicit over implicit
- Keep functions small and focused on a single task
- Handle errors gracefully with meaningful error messages

### TypeScript Conventions

**Types vs Interfaces**
- Use `type` for unions, primitives, and composition
- Use `interface` for object shapes that may be extended
- Export types from `types.ts` for shared definitions

**Null/Undefined Handling**
- Use optional parameters with `?` when appropriate
- Check for null/undefined explicitly: `if (!service) throw new Error(...)`
- Avoid `as any` casts; use proper types or type guards instead

**Function Signatures**
- Always specify return types for exported functions
- Use explicit parameter types
- Prefer `AsyncIterable<T>` for streaming responses

### Naming Conventions

**Files**
- Use kebab-case: `openrouter.ts`, `cerebras.ts`
- One main export per file named after the file: `export const openrouterService = ...`

**Variables and Functions**
- Use camelCase: `currentServiceIndex`, `getNextService()`
- Use PascalCase for types and interfaces: `AIService`, `ChatMessage`
- Use UPPER_SASE for constants: `DEFAULT_MODEL`

**Services**
- Service objects follow pattern: `{ name: 'ProviderName', chat: ... }`
- Service variables named: `groqService`, `cerebrasService`, `openrouterService`

### Import Conventions

**Order**
1. Built-in/Node imports
2. Third-party package imports
3. Relative imports (sorted by path depth)

```typescript
// Correct order
import { cerebrasService } from "./services/cerebras";
import { groqService } from "./services/groq";
import type { AIService, ChatMessage } from "./types";
```

**Type-only Imports**
Use `import type` for type-only imports to avoid runtime overhead:
```typescript
import type { AIService, ChatMessage } from "./types";
```

### Error Handling

**Server Errors**
- Log errors with `console.error()`
- Return proper JSON error responses with `type` field
- Use HTTP status codes: 400 for bad requests, 500 for server errors

```typescript
catch (error) {
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
```

**API Key Validation**
- Validate required API keys at module load time
- Throw clear error messages indicating which key is missing

```typescript
if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY environment variable is required');
}
```

### Streaming Responses

Use async generators for streaming:
```typescript
async function* streamWithOpenAIFormat(
    stream: AsyncIterable<string>,
    request: OpenAIChatCompletionRequest
): AsyncGenerator<string> {
    for await (const chunk of stream) {
        yield `data: ${JSON.stringify(chunk)}\n\n`;
    }
    yield 'data: [DONE]\n\n';
}
```

### Project Structure

```
free-ai-api/
├── index.ts          # Main server entry point
├── types.ts          # Shared TypeScript types
├── services/         # AI provider implementations
│   ├── groq.ts
│   ├── cerebras.ts
│   └── openrouter.ts
├── package.json
├── .env.example      # Environment variables template
└── .gitignore
```

### Service Implementation Pattern

Each service follows this structure:
```typescript
import type { AIService, ChatMessage } from '../types';

const DEFAULT_MODEL = 'provider-specific-model';

export const providerService: AIService = {
    name: 'ProviderName',
    async chat(messages: ChatMessage[], model?: string) {
        const stream = await provider.chat.completions.create({
            messages,
            model: model || DEFAULT_MODEL,
            stream: true
        });

        return (async function* () {
            for await (const chunk of stream) {
                yield chunk.choices[0]?.delta?.content || '';
            }
        })();
    }
};
```

### Git Commit Messages

Follow Conventional Commits format:
- `feat: description` for new features
- `fix: description` for bug fixes
- `chore: description` for maintenance
- `docs: description` for documentation

Write commit messages in Spanish or English consistently.

### Environment Variables

- Use `.env.example` to document required variables
- Never commit real API keys
- Bun automatically loads `.env` files, no `dotenv` package needed
