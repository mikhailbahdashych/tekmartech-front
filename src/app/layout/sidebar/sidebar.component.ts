import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { LucideAngularModule, Terminal, Plug, Users, Clock, Settings, LogOut, Plus, History } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: any;
  adminOnly: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly icons = { Terminal, Plug, Users, Clock, Settings, LogOut, Plus, History };

  readonly navItems: NavItem[] = [
    { label: 'Queries', route: '/queries', icon: Terminal, adminOnly: false },
    { label: 'History', route: '/queries/history', icon: History, adminOnly: false },
    { label: 'Integrations', route: '/integrations', icon: Plug, adminOnly: true },
    { label: 'Team', route: '/users', icon: Users, adminOnly: true },
    { label: 'Activity Log', route: '/activity-logs', icon: Clock, adminOnly: true },
    { label: 'Settings', route: '/settings', icon: Settings, adminOnly: true },
  ];

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  readonly user = computed(() => this.authService.currentUser());
  readonly userInitials = computed(() => {
    const u = this.user();
    if (!u?.display_name) return '?';
    return u.display_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  readonly visibleNavItems = computed(() =>
    this.navItems.filter(item => !item.adminOnly || this.isAdmin())
  );

  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }
}
