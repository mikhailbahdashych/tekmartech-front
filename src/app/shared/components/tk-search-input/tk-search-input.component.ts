import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { Search, X } from 'lucide-angular';

@Component({
  selector: 'tk-search-input',
  standalone: true,
  imports: [TkIconComponent],
  templateUrl: './tk-search-input.component.html',
  styleUrl: './tk-search-input.component.scss',
})
export class TkSearchInputComponent implements OnDestroy {
  readonly placeholder = input('Search...');
  readonly debounceMs = input(300);
  readonly disabled = input(false);
  readonly testId = input('');
  readonly searchChange = output<string>();

  readonly icons = { Search, X };
  readonly value = signal('');

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.scheduleEmit(val);
  }

  clear(): void {
    this.value.set('');
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.searchChange.emit('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.clear();
      (event.target as HTMLInputElement).blur();
    }
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  private scheduleEmit(val: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchChange.emit(val);
    }, this.debounceMs());
  }
}
