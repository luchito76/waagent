export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    escalated?: boolean;
}

export interface ChatApiRequest {
    message: string;
    sessionId?: string;
}

export interface ChatApiResponse {
    reply: string;
    sessionId: string;
    escalated: boolean;
}

export interface ClinicInfo {
    name: string;
    tagline: string;
    phone: string;
    hours: string;
    avatarInitials: string;
}

/** Sugerencias que aparecen al inicio para que el demo sea instantáneo */
export const DEMO_SUGGESTIONS: string[] = [
    '¿Qué obras sociales aceptan?',
    '¿Cuáles son los horarios de atención?',
    '¿Cómo saco un turno?',
    '¿Hacen análisis clínicos?',
    '¿Dónde están ubicados?',
];

export const CLINIC_INFO: ClinicInfo = {
    name: 'Clínica Patagonia',
    tagline: 'Asistente virtual · Disponible 24hs',
    phone: '299 4XX-XXXX',
    hours: 'Lun–Vie 8–20 · Sáb 8–13',
    avatarInitials: 'CP',
};