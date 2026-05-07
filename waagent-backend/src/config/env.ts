import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-', 'Invalid Anthropic API key format'),
    META_VERIFY_TOKEN: z.string().min(8, 'META_VERIFY_TOKEN must be at least 8 characters'),
    DEMO_TENANT_SLUG: z.string().default('clinica-demo'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;