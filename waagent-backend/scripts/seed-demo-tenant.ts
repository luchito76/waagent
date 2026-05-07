/**
 * SCRIPT DE SEED — Crea el tenant de demo en MongoDB
 *
 * Uso:
 *   npx tsx scripts/seed-demo-tenant.ts
 *
 * Requiere .env configurado con MONGODB_URI.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { TenantModel } from '../src/modules/tenant/tenant.model.js';

const DEMO_TENANT = {
    name: 'Clínica Patagonia',
    slug: 'clinica-demo',
    // En demo, estos campos son ficticios (no se usan para enviar WA real)
    whatsappPhoneNumberId: 'DEMO_PHONE_NUMBER_ID',
    whatsappToken: 'DEMO_TOKEN',
    businessInfo: {
        type: 'clinica' as const,
        address: 'Av. Argentina 1234, Neuquén Capital',
        phone: '299 4XX-XXXX',
        hours: 'Lunes a Viernes de 8:00 a 20:00, Sábados de 8:00 a 13:00',
        services: [
            'Clínica médica general',
            'Pediatría',
            'Ginecología',
            'Cardiología',
            'Traumatología',
            'Análisis clínicos',
            'Ecografías',
            'Radiografías digitales',
        ],
        insurances: [
            'OSDE',
            'Swiss Medical',
            'Galeno',
            'Medifé',
            'IOMA',
            'PAMI',
            'IOSEP (Neuquén)',
            'OSFATUN',
            'Particular (consultar aranceles)',
        ],
        howToGetAppointment:
            'Para sacar turno podés llamarnos al 299 4XX-XXXX en horario de atención, o enviarnos un mensaje y te asignamos un turno disponible.',
        extraInfo:
            'Contamos con estacionamiento propio y acceso para personas con movilidad reducida. Los resultados de análisis se entregan en 24-48 horas hábiles.',
    },
    ragEnabled: false,
    active: true,
};

async function seed(): Promise<void> {
    const uri = process.env['MONGODB_URI'];
    if (!uri) {
        console.error('❌ MONGODB_URI not set in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Upsert — si ya existe, actualiza; si no, crea
    const result = await TenantModel.findOneAndUpdate(
        { slug: DEMO_TENANT.slug },
        DEMO_TENANT,
        { upsert: true, new: true }
    );

    console.log(`✅ Demo tenant ready: ${result.name} (slug: ${result.slug})`);
    console.log(`   ID: ${result._id}`);

    await mongoose.disconnect();
    console.log('✅ Done. Run: npm run dev');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});