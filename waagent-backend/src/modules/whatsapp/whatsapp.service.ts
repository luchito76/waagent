import type { TenantDocument } from '../tenant/tenant.model.js';

const META_API_VERSION = 'v19.0';
const META_BASE_URL = 'https://graph.facebook.com';

export class WhatsAppService {
    /**
     * Envía un mensaje de texto a un número de WhatsApp.
     * Usa el token y phoneNumberId del tenant correspondiente.
     */
    async sendTextMessage(
        tenant: TenantDocument,
        toPhone: string,
        text: string
    ): Promise<void> {
        const url = `${META_BASE_URL}/${META_API_VERSION}/${tenant.whatsappPhoneNumberId}/messages`;

        const body = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: toPhone,
            type: 'text',
            text: { body: text },
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tenant.whatsappToken}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(
                `WhatsApp API error ${response.status}: ${error}`
            );
        }
    }

    /**
     * Marca un mensaje como leído.
     * Mejora la UX — el usuario ve los dos ticks azules.
     */
    async markAsRead(
        tenant: TenantDocument,
        messageId: string
    ): Promise<void> {
        const url = `${META_BASE_URL}/${META_API_VERSION}/${tenant.whatsappPhoneNumberId}/messages`;

        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tenant.whatsappToken}`,
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            }),
        });
        // No tiramos error si falla — el marking es best-effort
    }
}