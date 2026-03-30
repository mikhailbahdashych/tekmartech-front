import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Terminal, Plug, Users, Clock, Settings, LogOut, Plus, History, Sun, Moon } from 'lucide-angular';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';

interface NavItem {
  label: string;
  route: string;
  icon: any;
  adminOnly: boolean;
  testId: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly state = input<'expanded' | 'collapsed' | 'hidden'>('expanded');

  readonly icons = { Terminal, Plug, Users, Clock, Settings, LogOut, Plus, History, Sun, Moon };
  readonly themeService = inject(ThemeService);

  readonly navItems: NavItem[] = [
    { label: 'Queries', route: '/new', icon: Terminal, adminOnly: false, testId: 'sidebar-nav-queries' },
    { label: 'History', route: '/queries/history', icon: History, adminOnly: false, testId: 'sidebar-nav-history' },
    { label: 'Integrations', route: '/integrations', icon: Plug, adminOnly: true, testId: 'sidebar-nav-integrations' },
    { label: 'Team', route: '/users', icon: Users, adminOnly: true, testId: 'sidebar-nav-team' },
    { label: 'Activity Log', route: '/activity-logs', icon: Clock, adminOnly: true, testId: 'sidebar-nav-activity-log' },
    { label: 'Settings', route: '/settings', icon: Settings, adminOnly: true, testId: 'sidebar-nav-settings' },
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

  readonly isExpanded = computed(() => this.state() === 'expanded');
  readonly isCollapsed = computed(() => this.state() === 'collapsed');

  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }
}
