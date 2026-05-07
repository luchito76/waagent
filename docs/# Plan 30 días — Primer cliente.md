# Plan 30 días — Primer cliente

## Objetivo
Cerrar un cliente pago antes de fin del mes 1.
Precio target: $300-400 USD setup + $80-120 USD/mes mantenimiento.

## Nicho elegido
Clínicas, consultorios médicos y odontológicos en Neuquén capital.

## Semana 1 — Demo funcional
- [ ] Construir interfaz de chat web (Angular)
- [ ] Backend Node.js + Claude API con system prompt de clínica ficticia
- [ ] RAG básico sobre JSON estático (no MongoDB todavía)
- [ ] Deploy en Railway con URL pública
- [ ] Probar flujo completo: consulta → respuesta → escalado a humano

## Semana 2 — Prospección
- [ ] Lista de 20-30 clínicas/consultorios en Google Maps Neuquén
- [ ] Identificar nombre del decisor (dueño/director médico)
- [ ] Mandar mensaje inicial a 15-20 contactos (WhatsApp o Instagram DM)
- [ ] Template mensaje: pregunta sobre dolor específico, no pitch de venta

## Semana 3 — Demos y cierre
- [ ] Hacer 3-5 demos por videollamada
- [ ] Usar estructura: dolor → demo → propuesta → precio
- [ ] Cerrar primer cliente con pago parcial adelantado (50%)

## Semana 4 — Entrega
- [ ] Cargar datos reales del cliente
- [ ] Conectar con WhatsApp real (Meta Cloud API)
- [ ] Pruebas con el dueño
- [ ] Lanzamiento
- [ ] Pedir referido activo

## Métricas a trackear
- Mensajes enviados
- Tasa de respuesta
- Demos realizadas
- Costo de adquisición del cliente
- Tiempo real de setup (para estimar proyectos futuros)

## Precios
| Concepto | Precio |
|---|---|
| Setup + primer mes (cliente 1) | $300-400 USD |
| Setup + primer mes (cliente 2+) | $500-600 USD |
| Mantenimiento mensual | $80-120 USD |

## Costos operativos por cliente/mes
| Concepto | Costo |
|---|---|
| Claude API (~1.000 consultas) | ~$5 USD |
| Railway (backend) | ~$5 USD |
| WhatsApp Cloud API | $0 (hasta 1.000 conv.) |
| MongoDB Atlas | $0 (M0 free) |
| Total | < $15 USD/mes |