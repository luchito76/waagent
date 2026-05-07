# Arquitectura base del producto

## Principios de diseño
- Multi-tenant desde el inicio (cada negocio es un tenant aislado)
- Un solo backend sirve a todos los clientes
- Configuración por tenant en base de datos (no hardcodeada)
- Deploy único, costos compartidos

## Stack

### Backend
- Node.js + Fastify + TypeScript
- Estructura: monolito modular (separar en servicios cuando escale)
- Auth: JWT con tenantId en claims

### IA
- Modelo: claude-sonnet-4-5 (equilibrio costo/calidad)
- Embeddings: voyage-3
- RAG: documentos del cliente indexados en MongoDB Atlas Vector Search
- System prompt: base genérico + sección específica por tenant

### Base de datos
- MongoDB Atlas M0 (free tier inicial)
- Colecciones: tenants, documents, conversations, messages
- Vector Search para RAG sobre documentos del cliente

### WhatsApp
- Meta WhatsApp Cloud API
- Webhook receiver en el backend
- Cada tenant tiene su propio número de WhatsApp Business

### Frontend demo
- Angular standalone
- Interfaz de chat simple para mostrar en demos
- Sin auth (demo pública con datos ficticios)

### Infra
- Railway: backend + MongoDB si no alcanza el Atlas free
- GitHub Actions: CI/CD automático en push a main
- Variables de entorno por tenant en Railway

## Estructura de carpetas (backend)

src/
├── config/
│   └── env.ts
├── modules/
│   ├── tenant/
│   │   ├── tenant.model.ts
│   │   ├── tenant.service.ts
│   │   └── tenant.repository.ts
│   ├── agent/
│   │   ├── agent.service.ts      ← orquesta Claude + RAG
│   │   ├── rag.service.ts        ← búsqueda vectorial
│   │   └── prompt.builder.ts     ← construye system prompt por tenant
│   ├── whatsapp/
│   │   ├── webhook.controller.ts ← recibe mensajes de Meta
│   │   └── whatsapp.service.ts   ← envía respuestas
│   └── conversation/
│       ├── conversation.model.ts
│       └── conversation.service.ts
├── shared/
│   ├── middleware/
│   │   └── tenant.middleware.ts
│   └── types/
│       └── index.ts
└── main.ts

## Modelo de datos — Tenant

{
  _id: ObjectId,
  name: string,                    // "Clínica San Martín"
  slug: string,                    // "clinica-san-martin" (único)
  whatsappPhoneNumberId: string,   // de Meta Business API
  whatsappToken: string,           // token de acceso
  systemPromptBase: string,        // instrucciones base del agente
  businessInfo: {
    type: string,                  // "clinica" | "inmobiliaria" | etc
    address: string,
    phone: string,
    hours: string,
    services: string[],
    insurances: string[],          // obras sociales (para clínicas)
  },
  ragEnabled: boolean,
  createdAt: Date,
  active: boolean
}

## Modelo de datos — Conversation

{
  _id: ObjectId,
  tenantId: ObjectId,
  customerPhone: string,           // número del paciente/cliente
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: Date
    }
  ],
  status: "active" | "escalated" | "closed",
  escalatedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}

## Flujo de un mensaje entrante

1. Meta envía webhook POST a /webhooks/whatsapp/:tenantSlug
2. webhook.controller extrae el mensaje y el número del remitente
3. Se busca o crea la conversación activa para ese número+tenant
4. agent.service construye el contexto:
   a. prompt.builder arma el system prompt con info del tenant
   b. rag.service busca documentos relevantes (si ragEnabled)
   c. Se agrega el historial de la conversación (últimos N mensajes)
5. Se llama a Claude API con el contexto completo
6. La respuesta se guarda en la conversación
7. whatsapp.service envía la respuesta al número del cliente

## Decisiones técnicas clave

DECISIÓN: Un webhook por tenant (/:tenantSlug) en lugar de uno genérico
RAZÓN: Meta requiere un webhook URL por número de WhatsApp Business.
       Así cada tenant tiene su URL propia y el routing es trivial.

DECISIÓN: Historial de conversación en MongoDB (no en memoria)
RAZÓN: Los mensajes llegan de forma stateless desde Meta.
       El historial debe persistir entre webhooks.
       Ventaja extra: queda disponible para analítica futura.

DECISIÓN: System prompt construido dinámicamente por tenant
RAZÓN: Permite actualizar la info del negocio sin tocar código.
       El dueño puede pedir cambios y se aplican en minutos.

DECISIÓN: RAG opcional por tenant (ragEnabled flag)
RAZÓN: Para el MVP no todos los clientes lo necesitan.
       Una clínica chica funciona bien con system prompt rico.
       RAG se activa cuando el volumen de documentos lo justifica.