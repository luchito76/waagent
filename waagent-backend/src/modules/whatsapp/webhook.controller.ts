import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../config/env';
import { TenantService } from '../tenant/tenant.service';
import { TenantRepository } from '../tenant/tenant.repository';
import { ConversationService } from '../conversation/conversation.service';
import { AgentService } from '../agent/agent.service';
import { WhatsAppService } from './whatsapp.service';
import type { MetaWebhookPayload } from '../../shared/types/index';

const tenantService = new TenantService(new TenantRepository());
const conversationService = new ConversationService();
const agentService = new AgentService(conversationService);
const whatsappService = new WhatsAppService();

interface WebhookVerifyQuery {
    'hub.mode': string;
    'hub.verify_token': string;
    'hub.challenge': string;
}

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /webhooks/whatsapp/:tenantSlug
     * Meta llama a este endpoint para verificar el webhook.
     * Solo ocurre una vez al configurar el número en Meta Business.
     */
    fastify.get<{ Params: { tenantSlug: string }; Querystring: WebhookVerifyQuery }>(
        '/webhooks/whatsapp/:tenantSlug',
        async (req: FastifyRequest<{ Params: { tenantSlug: string }; Querystring: WebhookVerifyQuery }>, reply: FastifyReply) => {
            const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

            if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
                req.log.info(`Webhook verified for tenant: ${req.params.tenantSlug}`);
                return reply.send(challenge);
            }

            req.log.warn(`Webhook verification failed for tenant: ${req.params.tenantSlug}`);
            return reply.status(403).send({ error: 'Verification failed' });
        }
    );

    /**
     * POST /webhooks/whatsapp/:tenantSlug
     * Meta envía cada mensaje entrante aquí.
     *
     * CRÍTICO: responder 200 INMEDIATAMENTE, procesar async.
     * Si tardamos > 20s en responder, Meta reintenta y recibimos duplicados.
     */
    fastify.post<{ Params: { tenantSlug: string } }>(
        '/webhooks/whatsapp/:tenantSlug',
        async (req: FastifyRequest<{ Params: { tenantSlug: string } }>, reply: FastifyReply) => {
            // Responder 200 inmediatamente — Meta no espera
            reply.status(200).send({ status: 'ok' });

            // Procesar en background (no await)
            processWebhook(req.params.tenantSlug, req.body as MetaWebhookPayload, req.log).catch(
                (err) => req.log.error({ err }, 'Error processing webhook')
            );
        }
    );
}

/**
 * Procesamiento async del webhook.
 * Se ejecuta después de responder 200 a Meta.
 */
async function processWebhook(
    tenantSlug: string,
    payload: MetaWebhookPayload,
    log: FastifyRequest['log']
): Promise<void> {
    // Validar estructura del payload
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
        // Status update (sent/delivered/read) — ignorar
        return;
    }

    const message = messages[0];
    if (!message) return;

    // Solo procesamos mensajes de texto (por ahora)
    if (message.type !== 'text' || !message.text?.body) {
        log.info({ messageType: message.type }, 'Non-text message received, skipping');
        return;
    }

    const customerPhone = message.from;
    const incomingText = message.text.body;
    const messageId = message.id;

    try {
        // 1. Obtener tenant
        const tenant = await tenantService.getBySlug(tenantSlug);

        // 2. Marcar como leído (UX: ticks azules)
        await whatsappService.markAsRead(tenant, messageId).catch(() => {
            // Best-effort, no bloqueante
        });

        // 3. Obtener/crear conversación
        const conversation = await conversationService.getOrCreate(
            tenant._id,
            customerPhone
        );

        // 4. Procesar con el agente de IA
        const { reply } = await agentService.processMessage(
            tenant,
            conversation,
            incomingText
        );

        // 5. Enviar respuesta al cliente
        await whatsappService.sendTextMessage(tenant, customerPhone, reply);

        log.info(
            { tenantSlug, customerPhone: `${customerPhone.slice(0, 6)}***` },
            'Message processed and replied'
        );
    } catch (err) {
        log.error({ err, tenantSlug, customerPhone: `${customerPhone.slice(0, 6)}***` }, 'Error in webhook processing');
        // No re-throw — ya respondimos 200 a Meta
    }
}