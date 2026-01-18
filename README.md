# Free AI API

Una API unificada que combina múltiples servicios de IA (Groq, Cerebras, OpenRouter) con interfaz compatible con OpenAI.

## Caracteristicas

- **API compatible con OpenAI** - Formato estándar de OpenAI
- **Multi-provider** - Round-robin entre Groq, Cerebras y OpenRouter
- **Streaming** - Soporte completo para respuestas en streaming
- **Bun** - Servidor rápido con Bun runtime

## Modelo

| Modelo | Descripción |
|--------|-------------|
| `free-ai-api` | Usa round-robin entre proveedores con sus modelos por defecto |

Modelos internos por proveedor:
- Groq: `moonshotai/kimi-k2-instruct-0905`
- Cerebras: `gpt-oss-120b`
- OpenRouter: `xiaomi/mimo-v2-flash:free`

## Instalacion

```bash
bun install
```

## Configuracion

Configura las variables de entorno en tu plataforma de despliegue:

```env
# Al menos una de estas (todas recomendadas para round-robin)
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
    "model": "free-ai-api",
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
    model="free-ai-api",
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
    model: 'free-ai-api',
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

### n8n

En n8n, usa el nodo HTTP Request con:
- **Method**: POST
- **URL**: `http://tu-servidor:3000/v1/chat/completions`
- **Authentication**: None
- **Headers**:
  - `Content-Type`: `application/json`
- **Body (JSON)**:
  ```json
  {
    "model": "free-ai-api",
    "messages": [{"role": "user", "content": "{{ $json.message }}"}],
    "stream": false
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
