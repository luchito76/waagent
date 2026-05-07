import { TenantRepository } from './tenant.repository';
import type { TenantDocument } from './tenant.model';

export class TenantService {
    constructor(private readonly repo: TenantRepository) { }

    async getBySlug(slug: string): Promise<TenantDocument> {
        const tenant = await this.repo.findBySlug(slug);
        if (!tenant) {
            throw new Error(`Tenant not found: ${slug}`);
        }
        return tenant;
    }

    async getById(id: string): Promise<TenantDocument> {
        const tenant = await this.repo.findById(id);
        if (!tenant) {
            throw new Error(`Tenant not found: ${id}`);
        }
        return tenant;
    }
}