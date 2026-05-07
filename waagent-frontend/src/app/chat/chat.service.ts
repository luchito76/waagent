import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { ChatMessage, ChatApiRequest, ChatApiResponse } from './chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
    // --- Signals (estado reactivo) ---
    private readonly _messages = signal<ChatMessage[]>([]);
    private readonly _isLoading = signal(false);
    private readonly _sessionId = signal<string | null>(null);
    private readonly _error = signal<string | null>(null);

    readonly messages = this._messages.asReadonly();
    readonly isLoading = this._isLoading.asReadonly();
    readonly error = this._error.asReadonly();
    readonly hasMessages = computed(() => this._messages().length > 0);

    constructor(private readonly http: HttpClient) { }

    sendMessage(content: string): Observable<ChatApiResponse> {
        // Agregar mensaje del usuario inmediatamente (UX optimista)
        this._messages.update(msgs => [
            ...msgs,
            {
                id: crypto.randomUUID(),
                role: 'user',
                content,
                timestamp: new Date(),
            },
        ]);

        this._isLoading.set(true);
        this._error.set(null);

        const body: ChatApiRequest = {
            message: content,
            ...(this._sessionId() && { sessionId: this._sessionId()! }),
        };

        return this.http
            .post<ChatApiResponse>(`${environment.apiUrl}/chat`, body)
            .pipe(
                tap(response => {
                    // Persistir sessionId para mantener el historial
                    if (response.sessionId) {
                        this._sessionId.set(response.sessionId);
                    }

                    // Agregar respuesta del asistente
                    this._messages.update(msgs => [
                        ...msgs,
                        {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: response.reply,
                            timestamp: new Date(),
                            escalated: response.escalated,
                        },
                    ]);

                    this._isLoading.set(false);
                }),
                catchError((err: HttpErrorResponse) => {
                    this._isLoading.set(false);
                    const message =
                        err.status === 0
                            ? 'Sin conexión con el servidor. ¿Está el backend corriendo?'
                            : `Error ${err.status}: ${err.message}`;
                    this._error.set(message);

                    // Agregar mensaje de error en el chat para que el demo no quede roto
                    this._messages.update(msgs => [
                        ...msgs,
                        {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content:
                                'Hubo un problema al conectar. Intentá de nuevo en un momento.',
                            timestamp: new Date(),
                        },
                    ]);

                    return throwError(() => err);
                })
            );
    }

    clearConversation(): void {
        this._messages.set([]);
        this._sessionId.set(null);
        this._error.set(null);
    }
}