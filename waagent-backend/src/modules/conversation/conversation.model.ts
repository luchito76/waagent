import { Schema, model, type Document, type Types } from 'mongoose';
import type { IConversation, IMessage } from '../../shared/types/index';

export interface ConversationDocument extends Omit<IConversation, '_id'>, Document { }

const messageSchema = new Schema<IMessage>(
    {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    },
    { _id: false }
);

const conversationSchema = new Schema<ConversationDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        customerPhone: { type: String, required: true },
        messages: { type: [messageSchema], default: [] },
        status: {
            type: String,
            enum: ['active', 'escalated', 'closed'],
            default: 'active',
        },
        escalatedAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Lookup por teléfono+tenant (el más frecuente — cada webhook entrante)
conversationSchema.index({ tenantId: 1, customerPhone: 1 });
conversationSchema.index({ status: 1, updatedAt: -1 });

export const ConversationModel = model<ConversationDocument>('Conversation', conversationSchema);