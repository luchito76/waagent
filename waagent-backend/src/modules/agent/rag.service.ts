import type { Types } from 'mongoose';

/**
 * RAG Service — Búsqueda semántica sobre documentos del tenant.
 *
 * SEMANA 1: stub que retorna string vacío (RAG desactivado en demo).
 * ACTIVAR cuando el tenant tenga ragEnabled: true y documentos indexados.
 *
 * Para activar en producción:
 * 1. Instalar: npm install @anthropic-ai/sdk voyageai
 * 2. Crear colección 'documents' con campo 'embedding' (vector 1024-dim)
 * 3. Crear índice Atlas Vector Search sobre ese campo
 * 4. Descomentar la implementación real abajo
 */
export class RagService {
    async search(tenantId: Types.ObjectId, query: string): Promise<string> {
        // En Semana 1, siempre retorna vacío
        // El system prompt rico compensa la falta de RAG
        return '';

        /* IMPLEMENTACIÓN REAL (Semana 3+):
        
        // 1. Generar embedding de la consulta
        const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.VOYAGE_API_KEY}`,
          },
          body: JSON.stringify({
            input: query,
            model: 'voyage-3',
          }),
        });
        const { data } = await embeddingResponse.json();
        const queryVector: number[] = data[0].embedding;
    
        // 2. Atlas Vector Search
        const results = await DocumentModel.aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: 20,
              limit: 3,
              filter: { tenantId },
            },
          },
          {
            $project: {
              content: 1,
              score: { $meta: 'vectorSearchScore' },
            },
          },
        ]);
    
        if (!results.length) return '';
    
        // 3. Formatear contexto para el prompt
        return results
          .map((doc, i) => `[Documento ${i + 1}]\n${doc.content}`)
          .join('\n\n');
        */
    }
}