import { Component, input, output } from '@angular/core';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';
import { PlanStepCardComponent } from './plan-step-card.component';
import { Check, X } from 'lucide-angular';
import { QueryPlan } from '@features/queries/models';
import { QueryPhase } from '@features/queries/services/query-page.store';
import { IntegrationResponse } from '@features/integrations/models';

@Component({
  selector: 'app-ai-response',
  standalone: true,
  imports: [
    MarkdownPipe,
    TkButtonComponent,
    TkIconComponent,
    TkSpinnerComponent,
    TkIntegrationIconComponent,
    PlanStepCardComponent,
  ],
  templateUrl: './ai-response.component.html',
  styleUrl: './ai-response.component.scss',
})
export class AiResponseComponent {
  readonly interpretationText = input('');
  readonly isStreaming = input(false);
  readonly plan = input<QueryPlan | null>(null);
  readonly planSummary = input<string | null>(null);
  readonly estimatedDuration = input<number | null>(null);
  readonly phase = input<QueryPhase>('idle');
  readonly isApproving = input(false);
  readonly isRejecting = input(false);
  readonly integrationMap = input<Map<string, IntegrationResponse>>(new Map());
  readonly errorMessage = input<string | null>(null);

  readonly approve = output();
  readonly reject = output();

  readonly icons = { Check, X };

  getIntegration(integrationId: string): IntegrationResponse | null {
    return this.integrationMap().get(integrationId) ?? null;
  }
}
