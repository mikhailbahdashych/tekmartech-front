import { Component, input, output, signal } from '@angular/core';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkBadgeComponent, TkBadgeVariant } from '@shared/components/tk-badge/tk-badge.component';
import { TkTableComponent, TkTableColumn } from '@shared/components/tk-table/tk-table.component';
import { Download, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-angular';
import { ResultData, ResultTable, TransparencyLog } from '@features/queries/models';

@Component({
  selector: 'app-results-message',
  standalone: true,
  imports: [TkButtonComponent, TkIconComponent, TkBadgeComponent, TkTableComponent],
  templateUrl: './results-message.component.html',
  styleUrl: './results-message.component.scss',
})
export class ResultsMessageComponent {
  readonly resultSummary = input<string | null>(null);
  readonly resultData = input.required<ResultData>();
  readonly executionStatus = input<'completed' | 'partial' | null>(null);
  readonly transparencyLog = input<TransparencyLog | null>(null);
  readonly exportCsv = output();

  readonly icons = { Download, AlertTriangle, ChevronDown, ChevronRight };
  readonly logExpanded = signal(false);

  toggleLog(): void { this.logExpanded.update(v => !v); }

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getTableColumns(table: ResultTable): TkTableColumn[] {
    return table.columns.map(c => ({
      key: c.key,
      label: c.label,
      type: c.data_type,
      sortable: c.sortable,
    }));
  }

  statusVariant(status: string): TkBadgeVariant {
    switch (status) {
      case 'success':
      case 'completed':
        return 'success';
      case 'error':
      case 'failed':
        return 'error';
      case 'partial':
        return 'warning';
      default:
        return 'neutral';
    }
  }
}
