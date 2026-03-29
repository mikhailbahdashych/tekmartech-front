import { Component, inject } from '@angular/core';
import { RotateCcw, AlertCircle, Ban } from 'lucide-angular';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkCardComponent } from '@shared/components/tk-card/tk-card.component';
import { QueryPageStore } from '@features/queries/services/query-page.store';
import { QueryInputComponent } from '@features/queries/components/query-input/query-input.component';
import { InterpretationDisplayComponent } from '@features/queries/components/interpretation-display/interpretation-display.component';
import { PlanApprovalComponent } from '@features/queries/components/plan-approval/plan-approval.component';
import { ExecutionLogComponent } from '@features/queries/components/execution-log/execution-log.component';
import { ResultsDisplayComponent } from '@features/queries/components/results-display/results-display.component';
import { TransparencyLogComponent } from '@features/queries/components/transparency-log/transparency-log.component';

@Component({
  selector: 'app-query-page',
  standalone: true,
  imports: [
    TkButtonComponent,
    TkIconComponent,
    TkCardComponent,
    QueryInputComponent,
    InterpretationDisplayComponent,
    PlanApprovalComponent,
    ExecutionLogComponent,
    ResultsDisplayComponent,
    TransparencyLogComponent,
  ],
  providers: [QueryPageStore],
  templateUrl: './query-page.component.html',
  styleUrl: './query-page.component.scss',
})
export class QueryPageComponent {
  readonly store = inject(QueryPageStore);
  readonly icons = { RotateCcw, AlertCircle, Ban };

  onSubmit(event: { queryText: string }): void {
    this.store.submitQuery(event.queryText);
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

  onNewQuery(): void {
    this.store.reset();
  }
}
