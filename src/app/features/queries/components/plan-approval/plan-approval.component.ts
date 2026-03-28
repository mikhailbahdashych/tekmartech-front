import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, Check, X } from 'lucide-angular';
import { QueryPlan } from '../../models';

@Component({
  selector: 'app-plan-approval',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, LucideAngularModule],
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
