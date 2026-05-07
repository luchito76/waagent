import type { Types } from 'mongoose';

// ─── Tenant ────────────────────────────────────────────────────────────────

export type BusinessType = 'clinica' | 'odontologia' | 'inmobiliaria' | 'veterinaria' | 'otro';

export interface BusinessInfo {
    type: BusinessType;
    address: string;
    phone: string;
    hours: string;
    services: string[];
    insurances?: string[];      // obras sociales (solo clínicas)
    howToGetAppointment?: string; // cómo sacar turno
    extraInfo?: string;         // info adicional libre
}

export interface ITenant {
    _id: Types.ObjectId;
    name: string;
    slug: string;               // URL-safe, único: "clinica-san-martin"
    whatsappPhoneNumberId: string;
    whatsappToken: string;
    businessInfo: BusinessInfo;
    ragEnabled: boolean;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Conversation ──────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';
export type ConversationStatus = 'active' | 'escalated' | 'closed';

export interface IMessage {
    role: MessageRole;
    content: string;
    timestamp: Date;
}

export interface IConversation {
    _id: Types.ObjectId;
    tenantId: Types.ObjectId;
    customerPhone: string;
    messages: IMessage[];
    status: ConversationStatus;
    escalatedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ─── WhatsApp (Meta API payloads) ─────────────────────────────────────────

export interface MetaWebhookPayload {
    object: string;
    entry: MetaEntry[];
}

export interface MetaEntry {
    id: string;
    changes: MetaChange[];
}

export interface MetaChange {
    value: MetaChangeValue;
    field: string;
}

export interface MetaChangeValue {
    messaging_product: string;
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: MetaContact[];
    messages?: MetaMessage[];
    statuses?: MetaStatus[];
}

export interface MetaContact {
    profile: { name: string };
    wa_id: string;
}

export interface MetaMessage {
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker';
    text?: { body: string };
}

export interface MetaStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
}

// ─── Chat Demo (frontend) ─────────────────────────────────────────────────

export interface ChatRequest {
    message: string;
    sessionId?: string;
}

export interface ChatResponse {
    reply: string;
    sessionId: string;
    escalated: boolean;
}