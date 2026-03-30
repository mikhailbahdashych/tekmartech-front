import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { WebSocketService } from '@core/services/websocket.service';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { PanelLeft } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TkIconComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private wsService = inject(WebSocketService);

  readonly icons = { PanelLeft };
  private static readonly WIDE_BREAKPOINT = 1280;

  readonly isWideScreen = signal(window.innerWidth >= LayoutComponent.WIDE_BREAKPOINT);
  readonly sidebarOpen = signal(true);

  readonly sidebarState = computed<'expanded' | 'collapsed' | 'hidden'>(() => {
    if (this.sidebarOpen()) return 'expanded';
    return this.isWideScreen() ? 'collapsed' : 'hidden';
  });

  @HostListener('window:resize')
  onResize(): void {
    this.isWideScreen.set(window.innerWidth >= LayoutComponent.WIDE_BREAKPOINT);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  ngOnInit(): void { this.wsService.connect(); }
  ngOnDestroy(): void { this.wsService.disconnect(); }
}
