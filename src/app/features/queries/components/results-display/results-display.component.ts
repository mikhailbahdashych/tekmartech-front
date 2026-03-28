import { Component, input, output } from '@angular/core';
import { LucideAngularModule, Download, AlertTriangle } from 'lucide-angular';
import { MatButtonModule } from '@angular/material/button';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { ResultData } from '../../models';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [LucideAngularModule, MatButtonModule, DataTableComponent],
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
}
