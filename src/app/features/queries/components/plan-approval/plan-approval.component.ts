import { Component, input, output } from '@angular/core';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Check, X } from 'lucide-angular';
import { QueryPlan } from '@features/queries/models';

@Component({
  selector: 'app-plan-approval',
  standalone: true,
  imports: [TkButtonComponent, TkIconComponent],
  templateUrl: './plan-approval.component.html',
  styleUrl: './plan-approval.component.scss',
})
export class PlanApprovalComponent {
  readonly plan = input.required<QueryPlan>();
  readonly planSummary = input<string | null>(null);
  readonly estimatedDuration = input<number | null>(null);
  readonly isApproving = input(false);
  readonly isRejecting = input(false);
  readonly showActions = input(true);

  readonly approve = output();
  readonly reject = output();

  readonly icons = { Check, X };
}
