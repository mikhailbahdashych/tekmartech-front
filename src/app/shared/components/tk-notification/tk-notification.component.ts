import { Component, inject } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkNotificationService } from './tk-notification.service';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-angular';

@Component({
  selector: 'tk-notification-host',
  standalone: true,
  imports: [TkIconComponent],
  templateUrl: './tk-notification.component.html',
  styleUrl: './tk-notification.component.scss',
})
export class TkNotificationHostComponent {
  readonly notificationService = inject(TkNotificationService);
  readonly icons = { CheckCircle2, AlertCircle, Info, X };

  getIcon(variant: string) {
    switch (variant) {
      case 'success': return this.icons.CheckCircle2;
      case 'error': return this.icons.AlertCircle;
      default: return this.icons.Info;
    }
  }
}
