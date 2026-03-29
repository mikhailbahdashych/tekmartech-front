import { Component, HostListener, input, signal, computed, effect } from '@angular/core';
import { formatDate, formatNumber } from '@angular/common';
import { TkSpinnerComponent } from '@shared/components/tk-spinner/tk-spinner.component';

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
  readonly pageSize = input(25);
  readonly pageSizeOptions = input([10, 25, 50, 100]);

  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(0);
  readonly activePageSize = signal(25);
  readonly sizeDropdownOpen = signal(false);

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

  readonly totalRows = computed(() => this.sortedRows().length);
  readonly totalPages = computed(() => {
    const size = this.activePageSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(this.totalRows() / size));
  });
  readonly isPaginated = computed(() => this.activePageSize() > 0 && this.totalRows() > this.activePageSize());

  readonly paginatedRows = computed(() => {
    const size = this.activePageSize();
    if (size <= 0) return this.sortedRows();
    const start = this.currentPage() * size;
    return this.sortedRows().slice(start, start + size);
  });

  readonly rangeStart = computed(() => this.totalRows() === 0 ? 0 : this.currentPage() * this.activePageSize() + 1);
  readonly rangeEnd = computed(() => Math.min((this.currentPage() + 1) * this.activePageSize(), this.totalRows()));
  readonly canPrev = computed(() => this.currentPage() > 0);
  readonly canNext = computed(() => this.currentPage() < this.totalPages() - 1);

  constructor() {
    // Sync activePageSize from input
    effect(() => {
      this.activePageSize.set(this.pageSize());
    }, { allowSignalWrites: true });

    // Reset to page 0 when data, sort, or page size changes
    effect(() => {
      this.rows();
      this.sortKey();
      this.sortDir();
      this.activePageSize();
      this.currentPage.set(0);
    }, { allowSignalWrites: true });
  }

  toggleSizeDropdown(): void {
    this.sizeDropdownOpen.update(v => !v);
  }

  selectPageSize(size: number): void {
    this.activePageSize.set(size);
    this.sizeDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.sizeDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.tk-table__size-dropdown')) {
        this.sizeDropdownOpen.set(false);
      }
    }
  }

  prevPage(): void {
    if (this.canPrev()) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.canNext()) this.currentPage.update(p => p + 1);
  }

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
