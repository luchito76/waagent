import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { env } from '../../config/env';
import { TenantService } from '../tenant/tenant.service';
import { TenantRepository } from '../tenant/tenant.repository';
import { ConversationService } from '../conversation/conversation.service';
import { AgentService } from '../agent/agent.service';
import type { ChatRequest, ChatResponse } from '../../shared/types/index';

const tenantService = new TenantService(new TenantRepository());
const conversationService = new ConversationService();
const agentService = new AgentService(conversationService);

const chatRequestSchema = z.object({
    message: z.string().min(1).max(1000),
    sessionId: z.string().uuid().optional(),
});

/**
 * Rutas para el frontend de demo (Angular).
 * No usa WhatsApp — expone un endpoint HTTP simple de chat.
 * Sin auth: es una demo pública.
 */
export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * POST /chat
     * Recibe un mensaje del frontend y retorna la respuesta del agente.
     */
    fastify.post<{ Body: ChatRequest }>(
        '/chat',
        async (
            req: FastifyRequest<{ Body: ChatRequest }>,
            reply: FastifyReply
        ): Promise<ChatResponse> => {
            const parsed = chatRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                return reply.status(400).send({
                    error: 'Invalid request',
                    details: parsed.error.flatten(),
                });
            }

            const { message, sessionId } = parsed.data;
            const currentSessionId = sessionId ?? randomUUID();

            // Siempre usa el tenant de demo
            const tenant = await tenantService.getBySlug(env.DEMO_TENANT_SLUG);

            // Conversación identificada por sessionId (browser tab)
            const conversation = await conversationService.getOrCreateBySessionId(
                tenant._id,
                currentSessionId
            );

            const { reply: agentReply, escalated } = await agentService.processMessage(
                tenant,
                conversation,
                message
            );

            const response: ChatResponse = {
                reply: agentReply,
                sessionId: currentSessionId,
                escalated,
            };

            return reply.status(200).send(response);
        }
    );

    /**
     * GET /chat/health
     * Útil para verificar que el demo tenant está configurado.
     */
    fastify.get('/chat/health', async (_req, reply) => {
        try {
            const tenant = await tenantService.getBySlug(env.DEMO_TENANT_SLUG);
            return reply.send({
                status: 'ok',
                tenant: tenant.name,
                ragEnabled: tenant.ragEnabled,
            });
        } catch {
            return reply.status(503).send({
                status: 'error',
                message: `Demo tenant '${env.DEMO_TENANT_SLUG}' not found in database`,
            });
        }
    });
}