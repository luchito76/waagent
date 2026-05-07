# WAAgent — Centro de Comando del Proyecto

> Este archivo es tu única fuente de verdad. Cuando no sabés dónde está algo, empezá acá.

---

## 🗂️ Estructura de carpetas en tu máquina

```
~/proyectos/waagent/
│
├── waagent-backend/          ← Repositorio principal (Node.js + Fastify)
│   ├── src/                  ← Código fuente TypeScript
│   ├── scripts/              ← Scripts de utilidad (seed, ingest, etc.)
│   ├── .env                  ← Variables de entorno LOCALES (no commitear)
│   ├── .env.example          ← Template de variables (sí commitear)
│   └── README.md             ← Comandos y setup
│
├── waagent-frontend/         ← Demo Angular (crear en Semana 1)
│   └── (Angular standalone)
│
└── _docs/                    ← Documentación del negocio (NO es código)
    ├── CENTRO_DE_COMANDO.md  ← ESTE ARCHIVO
    ├── arquitectura_base.md  ← Decisiones técnicas
    ├── plan_primer_cliente.md← Plan 30 días
    ├── templates_comerciales.md ← Scripts de venta
    ├── clientes/
    │   └── clinica-demo/
    │       ├── datos-negocio.md  ← Info del cliente (para el prompt)
    │       └── conversaciones-test.md ← Pruebas manuales
    └── prospectos/
        └── lista-prospectos.md  ← Los 30 prospectos
```

---

## 🔑 Credenciales y accesos (NUNCA en git — solo en tu cabeza o gestor de passwords)

| Servicio | Dónde obtener | Variable en .env |
|---|---|---|
| MongoDB Atlas | atlas.mongodb.com | `MONGODB_URI` |
| Anthropic API | console.anthropic.com | `ANTHROPIC_API_KEY` |
| Railway | railway.app | (no va en .env, se configura en el dashboard) |
| Meta WhatsApp | developers.facebook.com | `WHATSAPP_TOKEN` por tenant |
| GitHub | github.com | (SSH key en tu máquina) |

---

## 🚀 Comandos que más vas a usar

### Backend — desarrollo local
```bash
cd ~/proyectos/waagent/waagent-backend

# Primera vez en una máquina nueva
npm install
cp .env.example .env
# → Completar .env con tus credenciales

# Crear la base de datos con el tenant de demo
npx tsx scripts/seed-demo-tenant.ts

# Correr en desarrollo (hot-reload)
npm run dev

# Probar que funciona
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola, qué servicios tienen?"}'

# Verificar tipos (antes de hacer push)
npm run typecheck
```

### Deploy
```bash
# Railway deploya automáticamente en push a main
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# → En 2-3 minutos está deployado en Railway
```

### Agregar un cliente nuevo
```bash
# 1. Copiar el script de seed
cp scripts/seed-demo-tenant.ts scripts/seed-[nombre-cliente].ts

# 2. Editar los datos del cliente en el nuevo archivo

# 3. Correr el script (apunta a la DB de producción)
MONGODB_URI=<tu-uri-de-produccion> npx tsx scripts/seed-[nombre-cliente].ts
```

---

## 📋 Estado actual del proyecto

### Fase activa: FASE 1 — Demo + Primer Cliente

| Tarea | Estado | Notas |
|---|---|---|
| Backend base | ✅ Completo | Fastify + MongoDB + Claude |
| Seed demo tenant | ✅ Listo | Ejecutar: `npx tsx scripts/seed-demo-tenant.ts` |
| Frontend Angular | ⏳ Pendiente | Interfaz de chat simple |
| Deploy Railway | ⏳ Pendiente | Necesita repo en GitHub primero |
| Prospección | ⏳ Pendiente | Lista de 30 clínicas en `_docs/prospectos/` |
| Primera demo agendada | ❌ No iniciado | |
| Primer cliente cerrado | ❌ No iniciado | |

---

## 🔧 Troubleshooting — problemas frecuentes

### "Cannot connect to MongoDB"
→ Verificar que `MONGODB_URI` en `.env` está bien copiado desde Atlas
→ Verificar que tu IP está en la whitelist de Atlas (Network Access)
→ En desarrollo: agregar `0.0.0.0/0` temporalmente

### "Tenant not found: clinica-demo"
→ El seed no fue ejecutado
→ Correr: `npx tsx scripts/seed-demo-tenant.ts`

### "Invalid Anthropic API key format"
→ La key debe empezar con `sk-ant-`
→ Regenerar en console.anthropic.com

### Railway no deploya
→ Verificar que todas las variables de entorno están configuradas en el dashboard de Railway
→ Ver los logs en Railway > Deployments

### El webhook de Meta no llega
→ Verificar que la URL pública de Railway está en la config de Meta
→ El endpoint de verificación GET debe responder 200
→ Probar manualmente: `curl https://tu-url.railway.app/health`

---

## 📅 Semana a semana

### Semana 1 (ACTUAL)
- [x] Backend completo con código
- [ ] Correr `npm install` y seed
- [ ] Crear repositorio en GitHub
- [ ] Deploy en Railway
- [ ] Frontend Angular básico
- [ ] URL pública funcionando

### Semana 2
- [ ] Lista de 30 prospectos completada
- [ ] Primeros 20 mensajes enviados
- [ ] 3+ respuestas recibidas

### Semana 3
- [ ] 3+ demos realizadas
- [ ] Primer cliente cerrado (50% adelantado)

### Semana 4
- [ ] Tenant real configurado en producción
- [ ] WhatsApp real conectado
- [ ] Lanzamiento con el cliente
- [ ] Referido pedido activamente

---

## 💡 Decisiones tomadas (para no volver a cuestionarlas)

| Decisión | Razón |
|---|---|
| Fastify en lugar de Express | Performance nativa, schema validation, mejor logging |
| MongoDB Atlas M0 | Free tier, escala cuando sea necesario |
| claude-sonnet-4-5 | Equilibrio costo/calidad para respuestas cortas |
| max_tokens: 500 | WhatsApp = mensajes cortos; limita costo y previene respuestas largas |
| Un webhook por tenant | Meta lo requiere; el routing es trivial |
| Responder 200 a Meta antes de procesar | Evitar duplicados por timeout |
| Sistema prompt dinámico | Cambios sin tocar código |

---

## 📞 Contexto de ventas

**Precio:** $300-400 USD setup (cliente 1) + $80-100 USD/mes mantenimiento
**Nicho:** Clínicas y consultorios médicos/odontológicos en Neuquén capital
**Pain point:** Tiempo perdido respondiendo WhatsApp manualmente
**Propuesta:** Bot 24/7 que responde y deriva a humano cuando corresponde

**URL de la demo:** https://[tu-url].railway.app (actualizar cuando esté deployada)

---

*Última actualización: Semana 1 — Setup inicial*