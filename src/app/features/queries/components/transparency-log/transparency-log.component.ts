import { Component, input, signal } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { ChevronDown, ChevronRight } from 'lucide-angular';
import { TransparencyLog } from '@features/queries/models';

@Component({
  selector: 'app-transparency-log',
  standalone: true,
  imports: [TkIconComponent, TkBadgeComponent],
  templateUrl: './transparency-log.component.html',
  styleUrl: './transparency-log.component.scss',
})
export class TransparencyLogComponent {
  readonly log = input.required<TransparencyLog>();
  readonly expanded = signal(false);
  readonly icons = { ChevronDown, ChevronRight };

  toggle(): void {
    this.expanded.update(v => !v);
  }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  statusVariant(status: string): TkBadgeVariant {
    switch (status) {
      case 'success': case 'completed': return 'success';
      case 'error': case 'failed': return 'error';
      case 'partial': return 'warning';
      default: return 'neutral';
    }
  }
}
