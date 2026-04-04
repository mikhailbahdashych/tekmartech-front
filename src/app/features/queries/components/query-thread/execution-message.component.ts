import { Component, computed, input } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { Loader2, CheckCircle2, XCircle } from 'lucide-angular';
import { ExecutionStepState } from '@features/queries/services/query-page.store';
import { IntegrationResponse } from '@features/integrations/models';

@Component({
  selector: 'execution-message',
  standalone: true,
  imports: [TkIconComponent, TkIntegrationIconComponent, TkSpinnerComponent],
  templateUrl: './execution-message.component.html',
  styleUrl: './execution-message.component.scss',
})
export class ExecutionMessageComponent {
  readonly steps = input<ExecutionStepState[]>([]);
  readonly totalSteps = input(0);
  readonly integrationMap = input<Map<string, IntegrationResponse>>(new Map());

  readonly icons = { Loader2, CheckCircle2, XCircle };

  readonly completedCount = computed(() =>
    this.steps().filter(s => s.status !== 'running').length
  );

  readonly isComplete = computed(() =>
    this.steps().length > 0 && this.steps().every(s => s.status !== 'running')
  );

  formatDuration(ms: number | undefined): string {
    if (ms == null) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getIntegrationType(step: ExecutionStepState): string | null {
    for (const integration of this.integrationMap().values()) {
      if (integration.display_name === step.integrationDisplayName) {
        return integration.type;
      }
    }
    return null;
  }
}
