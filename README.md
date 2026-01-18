# Free AI API

Una API unificada que combina múltiples servicios de IA (Groq, Cerebras, OpenRouter) con una interfaz compatible con OpenAI.

## Caracteristicas

- **API compatible con OpenAI** - Usa el mismo formato que la API de OpenAI
- **Multi-provider** - Round-robin entre Groq, Cerebras y OpenRouter
- **Streaming** - Soporte completo para respuestas en streaming
- **Bun** - Servidor rapido con Bun runtime

## Modelos disponibles

| Modelo | Provider |
|--------|----------|
| `moonshotai/kimi-k2-instruct-0905` | Groq |
| `gpt-oss-120b` | Cerebras |
| `xiaomi/mimo-v2-flash:free` | OpenRouter |

## Instalacion

```bash
bun install
```

## Configuracion

Crea un archivo `.env` con tus API keys:

```env
# Required - al menos uno de estos
GROQ_API_KEY=gsk_...
CEREBRAS_API_KEY=...
OPENROUTER_API_KEY=sk-...

# Opcional
PORT=3000
```

## Uso

Iniciar el servidor:

```bash
bun run index.ts
```

El servidor correra en `http://localhost:3000`

## Endpoints

### Chat Completions

```bash
curl -X POST "http://localhost:3000/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "moonshotai/kimi-k2-instruct-0905",
    "messages": [{"role": "user", "content": "Hola!"}],
    "stream": true
  }'
```

### Listar modelos

```bash
curl http://localhost:3000/v1/models
```

### Endpoint alternativo (raw)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hola!"}]}'
```

## Ejemplos

### Python

```python
import openai

client = openai.OpenAI(
    api_key="dummy",
    base_url="http://localhost:3000/v1"
)

response = client.chat.completions.create(
    model="moonshotai/kimi-k2-instruct-0905",
    messages=[{"role": "user", "content": "Dime un dato curioso"}],
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### Node.js

```javascript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'moonshotai/kimi-k2-instruct-0905',
    messages: [{ role: 'user', content: 'Hola!' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(decoder.decode(value));
}
```

## Estructura del proyecto

```
free-ai-api/
├── index.ts          # Servidor principal
├── types.ts          # Tipos TypeScript
├── services/
│   ├── groq.ts       # Servicio de Groq
│   ├── cerebras.ts   # Servicio de Cerebras
│   └── openrouter.ts # Servicio de OpenRouter
├── package.json
└── bun.lock
```

## Licencia

MIT
