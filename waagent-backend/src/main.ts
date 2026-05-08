import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { connectDatabase } from './shared/database/connections';
import { webhookRoutes } from './modules/whatsapp/webhook.controller';
import { chatRoutes } from './modules/chat/chat.routes';

async function bootstrap(): Promise<void> {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL,
            ...(env.NODE_ENV === 'development' && {
                transport: {
                    target: 'pino-pretty',
                    options: { colorize: true, translateTime: 'HH:MM:ss' },
                },
            }),
        },
    });

    // ─── Plugins ──────────────────────────────────────────────────────────────

    await app.register(helmet, {
        // Helmet en Fastify — no bloquear el webhook de Meta
        contentSecurityPolicy: false,
    });

    await app.register(cors, {
        // En producción, restringir a tu dominio Angular
        origin: env.NODE_ENV === 'development' ? true : ['https://waagent-eight.vercel.app'],
        methods: ['GET', 'POST'],
    });

    await app.register(rateLimit, {
        max: 100,        // 100 requests
        timeWindow: '1 minute',
        // Los webhooks de Meta tienen IP estable, no aplica rate limit
        allowList: ['127.0.0.1'],
    });

    // ─── Rutas ────────────────────────────────────────────────────────────────

    // Healthcheck Railway / uptime monitoring
    app.get('/health', async () => ({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    }));

    // Webhooks de WhatsApp (uno por tenant, Meta lo requiere)
    await app.register(webhookRoutes);

    // Chat HTTP para el frontend demo Angular
    await app.register(chatRoutes);

    // ─── 404 handler ─────────────────────────────────────────────────────────

    app.setNotFoundHandler((_req, reply) => {
        reply.status(404).send({ error: 'Not found' });
    });

    // ─── Error handler global ─────────────────────────────────────────────────

    app.setErrorHandler((error, req, reply) => {
        req.log.error({ err: error }, 'Unhandled error');
        reply.status(500).send({ error: 'Internal server error' });
    });

    // ─── Start ────────────────────────────────────────────────────────────────

    try {
        await connectDatabase();
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        app.log.info(`🚀 Server running on port ${env.PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

bootstrap();