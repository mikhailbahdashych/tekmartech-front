import { Component, computed, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe, formatDate, formatNumber } from '@angular/common';
import { ResultTable, ResultColumn } from '../../../features/queries/models';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  readonly table = input.required<ResultTable>();

  readonly sortColumnKey = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortedRows = computed(() => {
    const t = this.table();
    const key = this.sortColumnKey();
    if (!key) return t.rows;

    const colIndex = t.columns.findIndex(c => c.key === key);
    if (colIndex === -1) return t.rows;

    const col = t.columns[colIndex];
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    return [...t.rows].sort((a, b) => {
      const av = a[colIndex];
      const bv = b[colIndex];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (col.data_type === 'number') return (Number(av) - Number(bv)) * dir;
      if (col.data_type === 'datetime') return (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  toggleSort(column: ResultColumn): void {
    if (column.sortable === false) return;
    if (this.sortColumnKey() === column.key) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumnKey.set(column.key);
      this.sortDirection.set('asc');
    }
  }

  formatCell(value: unknown, column: ResultColumn): string {
    if (value == null) return '—';
    switch (column.data_type) {
      case 'boolean':
        return value ? '✓' : '—';
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);
      case 'datetime':
        try {
          return formatDate(String(value), 'short', 'en-US');
        } catch {
          return String(value);
        }
      case 'number':
        try {
          return formatNumber(Number(value), 'en-US');
        } catch {
          return String(value);
        }
      default:
        return String(value);
    }
  }
}
