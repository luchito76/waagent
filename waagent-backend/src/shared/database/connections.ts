import mongoose from 'mongoose';
import { env } from '../../config/env';

export async function connectDatabase(): Promise<void> {
    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connected');
    });
    mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnected');
    });

    await mongoose.connect(env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
}