import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  effect,
  signal,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from './chat.service';
import { DEMO_SUGGESTIONS, CLINIC_INFO, type ChatMessage } from './chat.models';

@Component({
  selector: 'app-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="shell">

      <!-- ══ PANEL IZQUIERDO — Info de la clínica ══ -->
      <aside class="sidebar" [class.sidebar--hidden]="isMobileView()">
        <div class="sidebar__brand">
          <div class="avatar avatar--lg">{{ clinicInfo.avatarInitials }}</div>
          <div>
            <h1 class="clinic-name">{{ clinicInfo.name }}</h1>
            <p class="clinic-tagline">{{ clinicInfo.tagline }}</p>
          </div>
        </div>

        <div class="sidebar__status">
          <span class="status-dot"></span>
          <span class="status-text">En línea ahora</span>
        </div>

        <div class="sidebar__info">
          <div class="info-item">
            <span class="info-icon">🕐</span>
            <div>
              <p class="info-label">Horario de atención</p>
              <p class="info-value">{{ clinicInfo.hours }}</p>
            </div>
          </div>
          <div class="info-item">
            <span class="info-icon">📞</span>
            <div>
              <p class="info-label">Teléfono</p>
              <p class="info-value">{{ clinicInfo.phone }}</p>
            </div>
          </div>
        </div>

        <div class="sidebar__demo-badge">
          <span class="demo-label">Demo interactiva</span>
          <p class="demo-desc">
            Escribí cualquier consulta como si fueras un paciente.
            El asistente responde con IA en tiempo real.
          </p>
        </div>

        <button class="btn-reset" (click)="resetConversation()" title="Reiniciar conversación">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Nueva conversación
        </button>
      </aside>

      <!-- ══ PANEL DERECHO — Chat ══ -->
      <main class="chat-panel">

        <!-- Header mobile -->
        <header class="chat-header">
          <div class="chat-header__left">
            <div class="avatar avatar--sm">{{ clinicInfo.avatarInitials }}</div>
            <div>
              <p class="chat-header__name">{{ clinicInfo.name }}</p>
              <p class="chat-header__status">
                <span class="status-dot status-dot--sm"></span>
                En línea
              </p>
            </div>
          </div>
          <button class="btn-icon" (click)="resetConversation()" title="Reiniciar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </header>

        <!-- Área de mensajes -->
        <section class="messages-area" #messagesArea>

          <!-- Estado vacío con sugerencias -->
          @if (!chatService.hasMessages()) {
            <div class="empty-state" @fadeIn>
              <div class="empty-state__icon">
                <div class="avatar avatar--xl">{{ clinicInfo.avatarInitials }}</div>
                <span class="online-ring"></span>
              </div>
              <h2 class="empty-state__title">Hola, ¿en qué puedo ayudarte?</h2>
              <p class="empty-state__subtitle">Soy el asistente de {{ clinicInfo.name }}. Consultame sobre turnos, servicios, obras sociales o cualquier duda que tengas.</p>

              <div class="suggestions">
                @for (suggestion of suggestions; track suggestion) {
                  <button class="suggestion-chip" (click)="sendSuggestion(suggestion)">
                    {{ suggestion }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Mensajes -->
          @for (message of chatService.messages(); track message.id) {
            <div class="message-row" [class.message-row--user]="message.role === 'user'">
              @if (message.role === 'assistant') {
                <div class="avatar avatar--sm avatar--bot">{{ clinicInfo.avatarInitials }}</div>
              }
              <div class="bubble-wrapper">
                <div
                  class="bubble"
                  [class.bubble--user]="message.role === 'user'"
                  [class.bubble--bot]="message.role === 'assistant'"
                  [class.bubble--escalated]="message.escalated"
                >
                  <p class="bubble__text">{{ message.content }}</p>
                  @if (message.escalated) {
                    <div class="escalation-hint">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 13.5 19.79 19.79 0 0 1 1.88 5.07 2 2 0 0 1 3.87 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17.92z"/></svg>
                      Derivado a profesional
                    </div>
                  }
                </div>
                <span class="bubble__time">{{ formatTime(message.timestamp) }}</span>
              </div>
            </div>
          }

          <!-- Indicador de typing -->
          @if (chatService.isLoading()) {
            <div class="message-row">
              <div class="avatar avatar--sm avatar--bot">{{ clinicInfo.avatarInitials }}</div>
              <div class="typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          }

          <!-- Ancla de scroll -->
          <div #scrollAnchor></div>
        </section>

        <!-- Input area -->
        <footer class="input-area">
          <div class="input-wrapper">
          <textarea
            #messageInput
            placeholder="Escribí tu consulta..."
            rows="1"
            class="message-input"
            (input)="onInput($event)">
          </textarea>

            <button
              class="send-btn"
              [class.send-btn--active]="inputHasText()"
              [disabled]="!inputHasText() || chatService.isLoading()"
              (click)="sendMessage()"
              title="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            </button>
          </div>
          <p class="input-hint">Enter para enviar · Shift+Enter para nueva línea</p>
        </footer>

      </main>
    </div>
  `,
  styles: [`
    /* ── Layout shell ──────────────────────────────────── */
    .shell {
      display: grid;
      grid-template-columns: 300px 1fr;
      height: 100vh;
      max-height: 100dvh;
      background: var(--color-bg);
    }

    /* ── Sidebar ────────────────────────────────────────── */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 0;
      background: var(--color-brand);
      padding: 32px 24px;
      overflow-y: auto;
      position: relative;
    }

    /* Textura sutil en el sidebar */
    .sidebar::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,.04) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255,255,255,.03) 0%, transparent 50%);
      pointer-events: none;
    }

    .sidebar__brand {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      position: relative;
    }

    .clinic-name {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 400;
      color: #ffffff;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }

    .clinic-tagline {
      font-size: 12px;
      color: rgba(255,255,255,.55);
      margin-top: 2px;
      font-weight: 300;
      letter-spacing: 0.02em;
    }

    .sidebar__status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,.08);
      border-radius: var(--radius-md);
      margin-bottom: 24px;
      position: relative;
    }

    .status-text {
      font-size: 13px;
      color: rgba(255,255,255,.8);
      font-weight: 300;
    }

    .sidebar__info {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 28px;
      position: relative;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .info-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

    .info-label {
      font-size: 11px;
      color: rgba(255,255,255,.45);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .info-value {
      font-size: 13px;
      color: rgba(255,255,255,.85);
      font-weight: 300;
    }

    .sidebar__demo-badge {
      margin-top: auto;
      padding: 14px 16px;
      background: rgba(255,255,255,.07);
      border-radius: var(--radius-md);
      border: 1px solid rgba(255,255,255,.1);
      position: relative;
    }

    .demo-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255,255,255,.4);
      font-weight: 500;
      display: block;
      margin-bottom: 6px;
    }

    .demo-desc {
      font-size: 12px;
      color: rgba(255,255,255,.6);
      line-height: 1.5;
      font-weight: 300;
    }

    .btn-reset {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: transparent;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: var(--radius-md);
      color: rgba(255,255,255,.6);
      font-family: var(--font-body);
      font-size: 12px;
      cursor: pointer;
      transition: all .2s;
      width: 100%;
      justify-content: center;
      position: relative;
    }

    .btn-reset:hover {
      background: rgba(255,255,255,.08);
      color: rgba(255,255,255,.9);
      border-color: rgba(255,255,255,.25);
    }

    /* ── Avatars ────────────────────────────────────────── */
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 400;
      border-radius: var(--radius-full);
      flex-shrink: 0;
      background: rgba(255,255,255,.15);
      color: #fff;
      letter-spacing: 0.02em;
    }

    .avatar--sm  { width: 34px; height: 34px; font-size: 12px; }
    .avatar--md  { width: 44px; height: 44px; font-size: 16px; }
    .avatar--lg  { width: 52px; height: 52px; font-size: 18px; }
    .avatar--xl  { width: 64px; height: 64px; font-size: 22px; }

    .avatar--bot {
      background: var(--color-brand-light);
      color: var(--color-brand);
      border: 1px solid var(--color-brand-soft);
      flex-shrink: 0;
      align-self: flex-end;
    }

    /* ── Status dot ─────────────────────────────────────── */
    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #4ade80;
      box-shadow: 0 0 0 2px rgba(74,222,128,.3);
      animation: pulse 2.5s ease-in-out infinite;
      flex-shrink: 0;
    }

    .status-dot--sm { width: 6px; height: 6px; }

    /* ── Chat panel ─────────────────────────────────────── */
    .chat-panel {
      display: flex;
      flex-direction: column;
      background: var(--color-bg-chat);
      overflow: hidden;
    }

    /* ── Chat header (mobile / decorativo) ─────────────── */
    .chat-header {
      display: none; /* visible solo en mobile */
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .chat-header__left { display: flex; align-items: center; gap: 10px; }

    .chat-header__name {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary);
    }

    .chat-header__status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--color-text-muted);
    }

    .btn-icon {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all .2s;
    }

    .btn-icon:hover {
      background: var(--color-brand-light);
      border-color: var(--color-brand-soft);
      color: var(--color-brand);
    }

    /* ── Messages area ──────────────────────────────────── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    /* ── Empty state ────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      max-width: 420px;
      margin: auto;
      animation: fadeSlideUp .4s ease-out;
    }

    .empty-state__icon {
      position: relative;
      margin-bottom: 20px;
    }

    .online-ring {
      position: absolute;
      bottom: 2px; right: 2px;
      width: 16px; height: 16px;
      background: #4ade80;
      border-radius: 50%;
      border: 2px solid var(--color-bg-chat);
      animation: pulse 2.5s ease-in-out infinite;
    }

    .empty-state__title {
      font-family: var(--font-display);
      font-size: 22px;
      font-weight: 400;
      color: var(--color-text-primary);
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }

    .empty-state__subtitle {
      font-size: 14px;
      color: var(--color-text-muted);
      line-height: 1.6;
      margin-bottom: 24px;
      font-weight: 300;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .suggestion-chip {
      padding: 8px 16px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      font-family: var(--font-body);
      font-size: 13px;
      color: var(--color-text-mid);
      cursor: pointer;
      transition: all .18s;
      font-weight: 400;
    }

    .suggestion-chip:hover {
      background: var(--color-brand-light);
      border-color: var(--color-brand-soft);
      color: var(--color-brand);
      transform: translateY(-1px);
    }

    /* ── Message rows ───────────────────────────────────── */
    .message-row {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      animation: fadeSlideUp .25s ease-out;
    }

    .message-row--user {
      flex-direction: row-reverse;
    }

    .bubble-wrapper {
      display: flex;
      flex-direction: column;
      max-width: min(72%, 520px);
      gap: 4px;
    }

    .message-row--user .bubble-wrapper {
      align-items: flex-end;
    }

    /* ── Bubbles ────────────────────────────────────────── */
    .bubble {
      padding: 12px 16px;
      border-radius: var(--radius-lg);
      position: relative;
    }

    .bubble--user {
      background: var(--bubble-user);
      color: var(--bubble-user-text);
      border-bottom-right-radius: 4px;
    }

    .bubble--bot {
      background: var(--bubble-bot);
      color: var(--bubble-bot-text);
      border: 1px solid var(--bubble-bot-border);
      border-bottom-left-radius: 4px;
      box-shadow: var(--shadow-card);
    }

    .bubble--escalated {
      border-color: var(--color-brand-soft);
    }

    .bubble__text {
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .bubble--user .bubble__text {
      color: rgba(255,255,255,.95);
      font-weight: 300;
    }

    .bubble__time {
      font-size: 10px;
      color: var(--color-text-muted);
      padding: 0 4px;
    }

    .escalation-hint {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--color-brand-soft);
      font-size: 11px;
      color: var(--color-brand);
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    /* ── Typing indicator ───────────────────────────────── */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 14px 18px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      border-bottom-left-radius: 4px;
      box-shadow: var(--shadow-card);
    }

    .typing-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--color-brand-soft);
      animation: typingDot 1.2s ease-in-out infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: .15s; }
    .typing-dot:nth-child(3) { animation-delay: .3s; }

    /* ── Input area ─────────────────────────────────────── */
    .input-area {
      padding: 16px 24px 20px;
      background: var(--color-bg-chat);
      border-top: 1px solid var(--color-border);
    }

    .input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 10px 10px 10px 16px;
      transition: border-color .2s, box-shadow .2s;
    }

    .input-wrapper:focus-within {
      border-color: var(--color-brand-soft);
      box-shadow: var(--shadow-input);
    }

    .message-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-family: var(--font-body);
      font-size: 14px;
      color: var(--color-text-primary);
      resize: none;
      line-height: 1.5;
      max-height: 120px;
      overflow-y: auto;
    }

    .message-input::placeholder { color: var(--color-text-muted); }
    .message-input:disabled { opacity: .5; cursor: not-allowed; }

    .send-btn {
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-border);
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      cursor: not-allowed;
      transition: all .2s;
      flex-shrink: 0;
    }

    .send-btn--active {
      background: var(--color-brand);
      color: #fff;
      cursor: pointer;
    }

    .send-btn--active:hover {
      background: var(--color-brand-mid);
      transform: scale(1.04);
    }

    .send-btn:disabled:not(.send-btn--active) {
      opacity: .4;
    }

    .input-hint {
      font-size: 10px;
      color: var(--color-text-muted);
      text-align: center;
      margin-top: 8px;
      font-weight: 300;
    }

    /* ── Responsive mobile ──────────────────────────────── */
    @media (max-width: 680px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .sidebar--hidden { display: none; }
      .chat-header { display: flex; }
      .messages-area { padding: 16px; }
      .input-area { padding: 12px 16px 16px; }
    }
  `],
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('messagesArea') private messagesAreaRef!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') private scrollAnchorRef!: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInputRef!: ElementRef<HTMLTextAreaElement>;

  protected readonly chatService = inject(ChatService);
  protected readonly clinicInfo = CLINIC_INFO;
  protected readonly suggestions = DEMO_SUGGESTIONS;
  protected readonly isMobileView = signal(window.innerWidth <= 680);
  protected readonly inputHasText = signal(false);

  private resizeObserver!: ResizeObserver;

  constructor() {
    // En zoneless, effect() es el patrón correcto para reaccionar a cambios de signal
    // y ejecutar efectos DOM como scroll. Reemplaza AfterViewChecked.
    effect(() => {
      // Leer el signal — registra la dependencia
      this.chatService.messages();
      this.chatService.isLoading();

      // Scroll al fondo después de que el DOM se actualice
      // queueMicrotask garantiza que Angular terminó de renderizar
      queueMicrotask(() => {
        this.scrollAnchorRef?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  ngOnInit(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.isMobileView.set(window.innerWidth <= 680);
    });
    this.resizeObserver.observe(document.body);
  }

  ngAfterViewInit(): void {
    // ViewChild está garantizado acá — no en ngOnInit
    this.messageInputRef.nativeElement.addEventListener(
      'keydown',
      this.handleKeydown,
      { capture: true }
    );
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    const textarea = this.messageInputRef?.nativeElement;
    textarea?.removeEventListener('keydown', this.handleKeydown, { capture: true });
  }

  // Arrow function para preservar el contexto de `this`
  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  };

  sendMessage(): void {
    const textarea = this.messageInputRef.nativeElement;
    const text = textarea.value.trim();
    if (!text || this.chatService.isLoading()) return;

    textarea.value = '';
    textarea.style.height = 'auto';
    this.inputHasText.set(false);
    textarea.focus();

    this.chatService.sendMessage(text).subscribe({
      error: () => { },
    });
  }

  sendSuggestion(text: string): void {
    const textarea = this.messageInputRef.nativeElement;
    textarea.value = text;
    this.inputHasText.set(true);
    this.sendMessage();
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.inputHasText.set(textarea.value.trim().length > 0);
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  resetConversation(): void {
    this.chatService.clearConversation();
    const textarea = this.messageInputRef?.nativeElement;
    if (textarea) {
      textarea.value = '';
      textarea.style.height = 'auto';
    }
    this.inputHasText.set(false);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  private resetTextareaHeight(): void {
    if (this.messageInputRef?.nativeElement) {
      this.messageInputRef.nativeElement.style.height = 'auto';
    }
  }
}