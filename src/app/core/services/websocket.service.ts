import { Injectable, signal } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';
import { QueryWsEvent } from '@features/queries/models';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  readonly connectionState = signal<ConnectionState>('disconnected');
  readonly reconnected$ = new Subject<void>();

  private socket: WebSocket | null = null;
  private messagesSubject = new Subject<Record<string, unknown>>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  readonly messages$: Observable<Record<string, unknown>> = this.messagesSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) return;

    const url = this.buildWsUrl(token);
    this.connectionState.set('connecting');
    this.intentionalClose = false;

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connectionState.set('connected');
      if (this.reconnectAttempts > 0) {
        this.reconnected$.next();
      }
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.messagesSubject.next(data);
      } catch {
        // Ignore malformed messages
      }
    };

    this.socket.onclose = (event: CloseEvent) => {
      this.connectionState.set('disconnected');
      this.socket = null;

      if (this.intentionalClose) return;

      // Auth-related close — refresh token first
      if (event.code === 4001 || event.code === 4003 || event.code === 1008) {
        this.reconnectWithRefresh();
      } else {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      // onclose will fire after onerror — reconnection handled there
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionState.set('disconnected');
    this.reconnectAttempts = 0;
  }

  messagesForQuery(queryId: string): Observable<QueryWsEvent> {
    return this.messages$.pipe(
      filter(msg => msg['query_id'] === queryId && typeof msg['event'] === 'string'),
      map(msg => msg as unknown as QueryWsEvent),
    );
  }

  private buildWsUrl(token: string): string {
    if (environment.wsBaseUrl) {
      return `${environment.wsBaseUrl}?token=${token}`;
    }
    // Derive from current location in production
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}/api/v1/ws?token=${token}`;
  }

  private scheduleReconnect(): void {
    this.connectionState.set('reconnecting');
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private reconnectWithRefresh(): void {
    this.connectionState.set('reconnecting');
    this.authService.silentRefresh().subscribe({
      next: () => {
        this.connect();
      },
      error: () => {
        // Refresh failed — stop reconnecting, auth interceptor will handle redirect
        this.connectionState.set('disconnected');
      },
    });
  }
}
