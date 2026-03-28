import { Component, input, signal, computed } from '@angular/core';
import { formatDate, formatNumber } from '@angular/common';
import { TkSpinnerComponent } from '../tk-spinner/tk-spinner.component';

export interface TkTableColumn {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'boolean' | 'datetime' | 'array';
  sortable?: boolean;
}

@Component({
  selector: 'tk-table',
  standalone: true,
  imports: [TkSpinnerComponent],
  templateUrl: './tk-table.component.html',
  styleUrl: './tk-table.component.scss',
})
export class TkTableComponent {
  readonly columns = input<TkTableColumn[]>([]);
  readonly rows = input<unknown[][]>([]);
  readonly loading = input(false);
  readonly emptyMessage = input('No data available');

  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const cols = this.columns();
    const data = this.rows();
    if (!key) return data;
    const idx = cols.findIndex(c => c.key === key);
    if (idx === -1) return data;
    const col = cols[idx];
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[idx]; const bv = b[idx];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (col.type === 'number') return (Number(av) - Number(bv)) * dir;
      if (col.type === 'datetime') return (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  });

  toggleSort(col: TkTableColumn): void {
    if (col.sortable === false) return;
    if (this.sortKey() === col.key) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  formatCell(value: unknown, col: TkTableColumn): string {
    if (value == null) return '\u2014';
    switch (col.type) {
      case 'boolean': return value ? '\u2713' : '\u2014';
      case 'array': return Array.isArray(value) ? value.join(', ') : String(value);
      case 'datetime':
        try { return formatDate(String(value), 'short', 'en-US'); } catch { return String(value); }
      case 'number':
        try { return formatNumber(Number(value), 'en-US'); } catch { return String(value); }
      default: return String(value);
    }
  }
}
