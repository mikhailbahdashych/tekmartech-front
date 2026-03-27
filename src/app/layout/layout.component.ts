import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WebSocketService } from '../core/services/websocket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen">
      <app-sidebar />
      <main class="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class LayoutComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);

  ngOnInit(): void {
    this.wsService.connect();
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }
}
