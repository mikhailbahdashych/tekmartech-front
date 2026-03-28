import { Component, inject } from '@angular/core';
import { LucideAngularModule, RotateCcw, AlertCircle, Ban } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { QueryPageStore } from '../../services/query-page.store';
import { QueryInputComponent } from '../../components/query-input/query-input.component';
import { InterpretationDisplayComponent } from '../../components/interpretation-display/interpretation-display.component';
import { PlanApprovalComponent } from '../../components/plan-approval/plan-approval.component';
import { ExecutionLogComponent } from '../../components/execution-log/execution-log.component';
import { ResultsDisplayComponent } from '../../components/results-display/results-display.component';
import { TransparencyLogComponent } from '../../components/transparency-log/transparency-log.component';

@Component({
  selector: 'app-query-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatButtonModule,
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
