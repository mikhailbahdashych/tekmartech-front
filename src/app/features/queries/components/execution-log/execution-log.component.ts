import { Component, computed, input } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Loader2, CheckCircle2, XCircle } from 'lucide-angular';
import { ExecutionStepState } from '@features/queries/services/query-page.store';

@Component({
  selector: 'execution-log',
  standalone: true,
  imports: [TkIconComponent],
  templateUrl: './execution-log.component.html',
  styleUrl: './execution-log.component.scss',
})
export class ExecutionLogComponent {
  readonly steps = input<ExecutionStepState[]>([]);
  readonly totalSteps = input(0);

  readonly icons = { Loader2, CheckCircle2, XCircle };

  readonly completedCount = computed(() =>
    this.steps().filter(s => s.status !== 'running').length
  );

  formatDuration(ms: number | undefined): string {
    if (ms == null) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}
