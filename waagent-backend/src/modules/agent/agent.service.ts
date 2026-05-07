import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { buildSystemPrompt, detectEscalation } from './prompt.builder.js';
import { RagService } from './rag.service.js';
import type { ConversationService } from '../conversation/conversation.service.js';
import type { TenantDocument } from '../tenant/tenant.model.js';
import type { ConversationDocument } from '../conversation/conversation.model.js';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOKENS = 500; // Suficiente para WhatsApp; limita costo

interface ProcessResult {
    reply: string;
    escalated: boolean;
}

export class AgentService {
    private readonly anthropic: Anthropic;
    private readonly ragService: RagService;

    constructor(private readonly conversationService: ConversationService) {
        this.anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        this.ragService = new RagService();
    }

    async processMessage(
        tenant: TenantDocument,
        conversation: ConversationDocument,
        incomingMessage: string
    ): Promise<ProcessResult> {
        // 1. Historial reciente (acotado para controlar tokens)
        const recentMessages = this.conversationService.getRecentMessages(conversation);

        // 2. RAG (solo si está habilitado para este tenant)
        let ragContext = '';
        if (tenant.ragEnabled) {
            ragContext = await this.ragService.search(
                tenant._id,
                incomingMessage
            );
        }

        // 3. System prompt dinámico
        const systemPrompt =
            buildSystemPrompt(tenant) +
            (ragContext
                ? `\n\n## Información específica encontrada para esta consulta\n${ragContext}`
                : '');

        // 4. Llamada a Claude
        const response = await this.anthropic.messages.create({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: [
                // Historial previo
                ...recentMessages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                // Mensaje actual
                { role: 'user', content: incomingMessage },
            ],
        });

        const firstContent = response.content[0];
        if (!firstContent || firstContent.type !== 'text') {
            throw new Error('Unexpected response type from Claude API');
        }
        const reply = firstContent.text;

        // 5. Detectar si se necesita escalado
        const escalated = detectEscalation(reply);

        // 6. Persistir ambos mensajes
        const now = new Date();
        await this.conversationService.appendMessages(conversation._id, [
            { role: 'user', content: incomingMessage, timestamp: now },
            { role: 'assistant', content: reply, timestamp: now },
        ]);

        // 7. Marcar como escalada si corresponde
        if (escalated && conversation.status === 'active') {
            await this.conversationService.markEscalated(conversation._id);
        }

        return { reply, escalated };
    }
}