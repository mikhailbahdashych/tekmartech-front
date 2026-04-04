import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TkNotificationHostComponent } from '@shared/components/tk-notification/tk-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TkNotificationHostComponent],
  template: `
    <tk-notification-host />
    <router-outlet />
  `,
})
export class AppComponent {}
