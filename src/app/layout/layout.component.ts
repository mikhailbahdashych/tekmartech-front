import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WebSocketService } from '@core/services/websocket.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
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
