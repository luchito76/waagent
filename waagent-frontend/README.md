# WAAgent Frontend — Demo Angular

Interfaz de chat para demostrar el asistente IA a potenciales clientes.

## Stack
- Angular 17 standalone (sin NgModules)
- Signals para estado reactivo
- HttpClient para llamadas al backend
- CSS puro (sin librerías de UI)

---

## Setup

```bash
cd waagent-frontend
npm install

# Desarrollo (apunta a localhost:3000)
npm start
# → http://localhost:4200

# Build producción
npm run build:prod
```

---

## Antes de hacer el deploy de producción

1. Editar `src/environments/environment.prod.ts`
2. Reemplazar la URL del backend:
   ```ts
   apiUrl: 'https://TU-BACKEND.up.railway.app'
   ```

---

## Personalizar para un cliente real

Todo lo que necesitás cambiar está en `src/app/chat/chat.models.ts`:

```typescript
export const CLINIC_INFO: ClinicInfo = {
  name: 'Nombre de la clínica',      // ← Cambiar
  tagline: 'Texto debajo del nombre', // ← Cambiar
  phone: '299 XXX-XXXX',             // ← Cambiar
  hours: 'Lun–Vie 8–20',            // ← Cambiar
  avatarInitials: 'XX',              // ← Iniciales del negocio
};

export const DEMO_SUGGESTIONS: string[] = [
  // ← Cambiar por preguntas reales del negocio
  '¿Qué obras sociales aceptan?',
  '¿Cómo saco un turno?',
  // ...
];
```

---

## Deploy en Railway

1. Crear nuevo proyecto en Railway
2. Conectar este repo (carpeta `waagent-frontend`)
3. Railway detecta Angular automáticamente con Nixpacks
4. Configurar variable de entorno si es necesario
5. URL pública generada automáticamente

O deployar en **Vercel** (más simple para estáticos):
```bash
npm install -g vercel
npm run build:prod
vercel dist/waagent-frontend/browser
```

---

## Estructura

```
src/
├── app/
│   ├── app.component.ts      ← Root component
│   ├── app.config.ts         ← Bootstrap providers
│   └── chat/
│       ├── chat.component.ts ← UI completa del chat
│       ├── chat.service.ts   ← Llamadas al backend + signals
│       └── chat.models.ts    ← Tipos + config de la clínica
├── environments/
│   ├── environment.ts        ← Dev (localhost:3000)
│   └── environment.prod.ts   ← Prod (URL de Railway)
├── index.html                ← Fuentes Google + meta tags
├── main.ts                   ← Bootstrap
└── styles.css                ← Design system tokens
```