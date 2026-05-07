import { Schema, model, type Document } from 'mongoose';
import type { ITenant, BusinessType } from '../../shared/types/index.js';

export interface TenantDocument extends Omit<ITenant, '_id'>, Document { }

const businessInfoSchema = new Schema(
    {
        type: {
            type: String,
            enum: ['clinica', 'odontologia', 'inmobiliaria', 'veterinaria', 'otro'] satisfies BusinessType[],
            required: true,
        },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        hours: { type: String, required: true },
        services: { type: [String], default: [] },
        insurances: { type: [String], default: [] },
        howToGetAppointment: { type: String },
        extraInfo: { type: String },
    },
    { _id: false }
);

const tenantSchema = new Schema<TenantDocument>(
    {
        name: { type: String, required: true, trim: true },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            match: /^[a-z0-9-]+$/,
        },
        whatsappPhoneNumberId: { type: String, required: true },
        whatsappToken: { type: String, required: true, select: false },
        businessInfo: { type: businessInfoSchema, required: true },
        ragEnabled: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Índice para lookup rápido por slug (usado en cada webhook)
tenantSchema.index({ slug: 1 });
tenantSchema.index({ active: 1 });

export const TenantModel = model<TenantDocument>('Tenant', tenantSchema);