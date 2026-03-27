import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    <div class="flex items-center justify-between px-1 py-3 text-sm text-slate-500">
      <span>Showing {{ currentCount() }} of {{ totalCount() }}</span>
      @if (hasMore()) {
        <button (click)="loadMore.emit()"
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Load more
        </button>
      }
    </div>
  `,
})
export class PaginationComponent {
  readonly hasMore = input(false);
  readonly totalCount = input(0);
  readonly currentCount = input(0);
  readonly loadMore = output();
}
