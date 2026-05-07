import type { Types } from 'mongoose';
import { ConversationModel, type ConversationDocument } from './conversation.model.js';
import type { IMessage } from '../../shared/types/index.js';

const MAX_HISTORY_MESSAGES = 10;

export class ConversationService {
    async getOrCreate(
        tenantId: Types.ObjectId,
        customerPhone: string
    ): Promise<ConversationDocument> {
        let conversation = await ConversationModel.findOne({
            tenantId,
            customerPhone,
            status: 'active',
        }).exec();

        if (!conversation) {
            conversation = await ConversationModel.create({
                tenantId,
                customerPhone,
                messages: [],
                status: 'active',
            });
        }

        return conversation;
    }

    /**
     * Devuelve los últimos N mensajes para enviar a Claude.
     * Limitar el historial controla el uso de tokens.
     */
    getRecentMessages(conversation: ConversationDocument): IMessage[] {
        return conversation.messages.slice(-MAX_HISTORY_MESSAGES);
    }

    async appendMessages(
        conversationId: Types.ObjectId,
        messages: IMessage[]
    ): Promise<void> {
        await ConversationModel.updateOne(
            { _id: conversationId },
            {
                $push: { messages: { $each: messages } },
                $set: { updatedAt: new Date() },
            }
        ).exec();
    }

    async markEscalated(conversationId: Types.ObjectId): Promise<void> {
        await ConversationModel.updateOne(
            { _id: conversationId },
            {
                $set: {
                    status: 'escalated',
                    escalatedAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        ).exec();
    }

    async markClosed(conversationId: Types.ObjectId): Promise<void> {
        await ConversationModel.updateOne(
            { _id: conversationId },
            { $set: { status: 'closed', updatedAt: new Date() } }
        ).exec();
    }

    /**
     * Para el frontend demo: busca conversación por sessionId (string).
     * En producción las conversaciones se identifican por teléfono.
     */
    async getOrCreateBySessionId(
        tenantId: Types.ObjectId,
        sessionId: string
    ): Promise<ConversationDocument> {
        // Usamos el sessionId como "teléfono" ficticio para la demo
        return this.getOrCreate(tenantId, `demo-${sessionId}`);
    }
}