import { Injectable, signal } from '@angular/core';

export interface TkNotification {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
  visible: boolean;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class TkNotificationService {
  readonly notifications = signal<TkNotification[]>([]);
  private nextId = 0;

  show(message: string, variant: 'success' | 'error' | 'info' = 'info', duration = 4000): void {
    const id = this.nextId++;
    const notification: TkNotification = { id, message, variant, visible: false, duration };

    this.notifications.update(list => [...list, notification]);

    // Trigger enter animation
    setTimeout(() => {
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, visible: true } : n)
      );
    }, 10);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  dismiss(id: number): void {
    // Trigger exit animation
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, visible: false } : n)
    );
    // Remove from DOM after animation
    setTimeout(() => {
      this.notifications.update(list => list.filter(n => n.id !== id));
    }, 300);
  }

  success(message: string, duration = 4000): void { this.show(message, 'success', duration); }
  error(message: string, duration = 6000): void { this.show(message, 'error', duration); }
  info(message: string, duration = 4000): void { this.show(message, 'info', duration); }
}
