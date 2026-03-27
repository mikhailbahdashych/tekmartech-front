import { Component, input, signal } from '@angular/core';
import { LucideAngularModule, ChevronDown, ChevronRight } from 'lucide-angular';
import { TransparencyLog } from '../../models';

@Component({
  selector: 'app-transparency-log',
  standalone: true,
  imports: [LucideAngularModule],
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

  statusClass(status: string): string {
    switch (status) {
      case 'success': return 'text-emerald-700 bg-emerald-50';
      case 'error': return 'text-red-700 bg-red-50';
      case 'partial': return 'text-amber-700 bg-amber-50';
      default: return 'text-slate-600 bg-slate-100';
    }
  }
}
