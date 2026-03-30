import { Component, input } from '@angular/core';
import { TkIntegrationIconComponent } from '@shared/components/tk-integration-icon/tk-integration-icon.component';
import { PlanStep } from '@features/queries/models';
import { getToolDisplayName } from '@features/queries/constants/tool-display-names';

@Component({
  selector: 'app-plan-step-card',
  standalone: true,
  imports: [TkIntegrationIconComponent],
  templateUrl: './plan-step-card.component.html',
  styleUrl: './plan-step-card.component.scss',
})
export class PlanStepCardComponent {
  readonly step = input.required<PlanStep>();
  readonly index = input(0);
  readonly integrationType = input<string | null>(null);
  readonly integrationName = input<string | null>(null);

  getDisplayName(): string {
    return getToolDisplayName(this.step().tool_name);
  }
}
