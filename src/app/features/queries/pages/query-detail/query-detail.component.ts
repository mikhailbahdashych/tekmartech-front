import { Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideAngularModule, ArrowLeft, AlertCircle, Ban } from 'lucide-angular';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { RelativeTimePipe } from '../../../../shared/pipes/relative-time.pipe';
import { QueryPageStore } from '../../services/query-page.store';
import { InterpretationDisplayComponent } from '../../components/interpretation-display/interpretation-display.component';
import { PlanApprovalComponent } from '../../components/plan-approval/plan-approval.component';
import { ExecutionLogComponent } from '../../components/execution-log/execution-log.component';
import { ResultsDisplayComponent } from '../../components/results-display/results-display.component';
import { TransparencyLogComponent } from '../../components/transparency-log/transparency-log.component';
import { QUERY_STATUS_CONFIG } from '../../constants/query-status';

@Component({
  selector: 'app-query-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideAngularModule,
    StatusBadgeComponent,
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
  readonly statusConfig = QUERY_STATUS_CONFIG;

  ngOnInit(): void {
    this.store.loadFromExisting(this.id());
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
