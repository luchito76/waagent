# WAAgent Backend

Agente conversacional de IA para WhatsApp — Multi-tenant.

## Stack
- Node.js 20 + Fastify + TypeScript
- MongoDB Atlas (Mongoose)
- Claude API (Anthropic)
- Meta WhatsApp Cloud API

---

## Setup desde cero (Semana 1)

### 1. Clonar y preparar
```bash
git clone <tu-repo>
cd waagent-backend
npm install
cp .env.example .env
```

### 2. Completar .env
Editar `.env` con tus credenciales reales:
- `MONGODB_URI` → de MongoDB Atlas > Connect > Drivers
- `ANTHROPIC_API_KEY` → de console.anthropic.com
- `META_VERIFY_TOKEN` → inventalo vos (ej: `mi_token_secreto_2024`)

### 3. Crear tenant de demo en la base
```bash
npx tsx scripts/seed-demo-tenant.ts
```

### 4. Correr en desarrollo
```bash
npm run dev
```
Debería ver: `🚀 Server running on port 3000`

### 5. Probar el chat demo
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, ¿qué obras sociales aceptan?"}'
```

---

## Deploy en Railway

### Primera vez
1. Ir a [railway.app](https://railway.app)
2. New Project > Deploy from GitHub repo
3. Seleccionar tu repo
4. Add Variables → copiar todas las variables de `.env`
5. Deploy automático en cada push a `main`

### URL del backend
Railway genera una URL pública tipo:
`https://waagent-backend-production.up.railway.app`

Esta URL es la que vas a configurar en Meta como webhook.

---

## Configurar webhook de Meta (cuando tengas el cliente real)

1. Ir a [developers.facebook.com](https://developers.facebook.com)
2. Tu App > WhatsApp > Configuration
3. Webhook URL: `https://tu-url.railway.app/webhooks/whatsapp/SLUG-DEL-TENANT`
4. Verify Token: el valor de `META_VERIFY_TOKEN` en tu `.env`
5. Subscribe to: `messages`

---

## Agregar un cliente real (Semana 4)

```typescript
// Editar scripts/seed-demo-tenant.ts con los datos reales
// O crear un nuevo script: scripts/seed-tenant-clinica-xyz.ts
// Copiar la estructura de DEMO_TENANT y cambiar los valores
npx tsx scripts/seed-nuevo-tenant.ts
```

---

## Estructura del proyecto

```
src/
├── config/
│   └── env.ts                    ← Validación de variables de entorno (Zod)
├── modules/
│   ├── tenant/
│   │   ├── tenant.model.ts       ← Schema de Mongoose
│   │   ├── tenant.repository.ts  ← Acceso a la base de datos
│   │   └── tenant.service.ts     ← Lógica de negocio
│   ├── conversation/
│   │   ├── conversation.model.ts ← Schema + historial de mensajes
│   │   └── conversation.service.ts
│   ├── agent/
│   │   ├── agent.service.ts      ← Orquesta Claude + RAG + conversación
│   │   ├── prompt.builder.ts     ← System prompt dinámico por tenant
│   │   └── rag.service.ts        ← Búsqueda semántica (stub en Semana 1)
│   ├── whatsapp/
│   │   ├── webhook.controller.ts ← Recibe mensajes de Meta
│   │   └── whatsapp.service.ts   ← Envía respuestas vía API
│   └── chat/
│       └── chat.routes.ts        ← Endpoint HTTP para el demo Angular
├── shared/
│   ├── database/
│   │   └── connection.ts         ← Conexión MongoDB
│   └── types/
│       └── index.ts              ← Tipos compartidos
└── main.ts                       ← Entry point, Fastify setup

scripts/
└── seed-demo-tenant.ts           ← Crear tenant de demo en la base
```

---

## Comandos útiles

```bash
npm run dev          # Desarrollo con hot-reload
npm run build        # Compilar TypeScript
npm run start        # Producción (requiere build previo)
npm run typecheck    # Verificar tipos sin compilar
```