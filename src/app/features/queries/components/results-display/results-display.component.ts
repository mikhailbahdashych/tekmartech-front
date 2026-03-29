import { Component, input, output } from '@angular/core';
import { TkButtonComponent } from '@shared/components/tk-button/tk-button.component';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { TkTableComponent, TkTableColumn } from '@shared/components/tk-table/tk-table.component';
import { Download, AlertTriangle } from 'lucide-angular';
import { ResultData, ResultTable } from '@features/queries/models';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [TkButtonComponent, TkIconComponent, TkTableComponent],
  templateUrl: './results-display.component.html',
  styleUrl: './results-display.component.scss',
})
export class ResultsDisplayComponent {
  readonly resultSummary = input<string | null>(null);
  readonly resultData = input.required<ResultData>();
  readonly executionStatus = input<'completed' | 'partial' | null>(null);

  readonly exportCsv = output();
  readonly icons = { Download, AlertTriangle };

  formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getTableColumns(table: ResultTable): TkTableColumn[] {
    return table.columns.map(c => ({ key: c.key, label: c.label, type: c.data_type, sortable: c.sortable }));
  }
}
