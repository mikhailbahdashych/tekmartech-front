import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { TkIconComponent } from '@shared/components/tk-icon/tk-icon.component';
import { ChevronDown, Check } from 'lucide-angular';

export interface TkMultiSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'tk-multi-select',
  standalone: true,
  imports: [TkIconComponent],
  templateUrl: './tk-multi-select.component.html',
  styleUrl: './tk-multi-select.component.scss',
})
export class TkMultiSelectComponent {
  readonly label = input('');
  readonly options = input<TkMultiSelectOption[]>([]);
  readonly selectedValues = input<string[]>([]);
  readonly allLabel = input('All');
  readonly disabled = input(false);
  readonly testId = input('');
  readonly selectionChange = output<string[]>();

  readonly isOpen = signal(false);
  readonly icons = { ChevronDown, Check };

  readonly displayText = computed(() => {
    const selected = this.selectedValues();
    const opts = this.options();
    if (selected.length === 0 || selected.length === opts.length) return this.allLabel();
    if (selected.length === 1) {
      const opt = opts.find(o => o.value === selected[0]);
      return opt?.label ?? selected[0];
    }
    return `${selected.length} selected`;
  });

  readonly allSelected = computed(() => {
    const opts = this.options();
    return opts.length > 0 && this.selectedValues().length === opts.length;
  });

  readonly noneSelected = computed(() => this.selectedValues().length === 0);

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
  }

  isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }

  toggleOption(value: string): void {
    const current = this.selectedValues();
    if (this.isSelected(value)) {
      this.selectionChange.emit(current.filter(v => v !== value));
    } else {
      this.selectionChange.emit([...current, value]);
    }
  }

  toggleAll(): void {
    if (this.allSelected() || this.noneSelected()) {
      // If all selected or none selected, toggle to opposite
      if (this.allSelected()) {
        this.selectionChange.emit([]);
      } else {
        this.selectionChange.emit(this.options().map(o => o.value));
      }
    } else {
      // Partially selected — select all
      this.selectionChange.emit(this.options().map(o => o.value));
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.isOpen.set(false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !(event.target as HTMLElement).closest('.tk-multi-select')) {
      this.isOpen.set(false);
    }
  }
}
