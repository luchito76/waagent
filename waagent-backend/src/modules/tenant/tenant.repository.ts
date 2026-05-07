import { TenantModel, type TenantDocument } from './tenant.model.js';

export class TenantRepository {
    async findBySlug(slug: string): Promise<TenantDocument | null> {
        return TenantModel.findOne({ slug, active: true })
            .select('+whatsappToken')
            .lean<TenantDocument>()
            .exec();
    }

    async findById(id: string): Promise<TenantDocument | null> {
        return TenantModel.findById(id)
            .select('+whatsappToken')
            .lean<TenantDocument>()
            .exec();
    }

    async findAll(): Promise<TenantDocument[]> {
        return TenantModel.find({ active: true }).lean<TenantDocument[]>().exec();
    }

    async create(data: Partial<TenantDocument>): Promise<TenantDocument> {
        const tenant = new TenantModel(data);
        return tenant.save();
    }

    async updateBusinessInfo(
        slug: string,
        data: Partial<TenantDocument['businessInfo']>
    ): Promise<TenantDocument | null> {
        return TenantModel.findOneAndUpdate(
            { slug },
            { $set: { businessInfo: data } },
            { new: true }
        )
            .lean<TenantDocument>()
            .exec();
    }
}