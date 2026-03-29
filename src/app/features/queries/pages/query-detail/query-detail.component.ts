import { Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ArrowLeft, AlertCircle, Ban } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { QueryPageStore } from '@features/queries/services/query-page.store';
import { InterpretationDisplayComponent } from '@features/queries/components/interpretation-display/interpretation-display.component';
import { PlanApprovalComponent } from '@features/queries/components/plan-approval/plan-approval.component';
import { ExecutionLogComponent } from '@features/queries/components/execution-log/execution-log.component';
import { ResultsDisplayComponent } from '@features/queries/components/results-display/results-display.component';
import { TransparencyLogComponent } from '@features/queries/components/transparency-log/transparency-log.component';
import { QueryStatus } from '@features/queries/models';

const STATUS_VARIANT_MAP: Record<QueryStatus, TkBadgeVariant> = {
  interpreting: 'info',
  awaiting_approval: 'warning',
  approved: 'accent',
  executing: 'info',
  completed: 'success',
  failed: 'error',
  rejected: 'neutral',
};

const STATUS_LABEL_MAP: Record<QueryStatus, string> = {
  interpreting: 'Interpreting',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  executing: 'Executing',
  completed: 'Completed',
  failed: 'Failed',
  rejected: 'Rejected',
};

@Component({
  selector: 'app-query-detail',
  standalone: true,
  imports: [
    TkButtonComponent,
    TkIconComponent,
    TkCardComponent,
    TkBadgeComponent,
    TkSpinnerComponent,
    RelativeTimePipe,
    InterpretationDisplayComponent,
    PlanApprovalComponent,
    ExecutionLogComponent,
    ResultsDisplayComponent,
    TransparencyLogComponent,
  ],
  providers: [QueryPageStore],
  templateUrl: './query-detail.component.html',
  styleUrl: './query-detail.component.scss',
})
export class QueryDetailComponent implements OnInit {
  readonly id = input.required<string>();

  readonly store = inject(QueryPageStore);
  private router = inject(Router);

  readonly icons = { ArrowLeft, AlertCircle, Ban };

  ngOnInit(): void {
    this.store.loadFromExisting(this.id());
  }

  getStatusVariant(status: string): TkBadgeVariant {
    return STATUS_VARIANT_MAP[status as QueryStatus] ?? 'neutral';
  }

  getStatusLabel(status: string): string {
    return STATUS_LABEL_MAP[status as QueryStatus] ?? status;
  }

  goBack(): void {
    this.router.navigate(['/queries/history']);
  }

  onApprove(): void {
    this.store.approveQuery();
  }

  onReject(): void {
    this.store.rejectQuery();
  }

  onExportCsv(): void {
    this.store.exportCsv();
  }
}
