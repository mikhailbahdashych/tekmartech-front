import { Component, HostListener, computed, input, output, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface TkSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'tk-select',
  standalone: true,
  templateUrl: './tk-select.component.html',
  styleUrl: './tk-select.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TkSelectComponent),
    multi: true,
  }],
})
export class TkSelectComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly options = input<TkSelectOption[]>([]);
  readonly placeholder = input('');
  readonly error = input<string | null>(null);
  readonly disabled = input(false);
  readonly testId = input<string | null>(null);
  readonly valueChange = output<string>();

  readonly value = signal('');
  readonly isDisabled = signal(false);
  readonly isOpen = signal(false);

  readonly displayLabel = computed(() => {
    const val = this.value();
    if (!val) return this.placeholder() || '';
    const opt = this.options().find(o => o.value === val);
    return opt?.label ?? val;
  });

  readonly isPlaceholder = computed(() => !this.value());

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  toggle(): void {
    if (this.disabled() || this.isDisabled()) return;
    this.isOpen.update(v => !v);
  }

  select(opt: TkSelectOption | null): void {
    const val = opt?.value ?? '';
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
    this.isOpen.set(false);
    this.onTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !(event.target as HTMLElement).closest('.tk-select')) {
      this.isOpen.set(false);
      this.onTouched();
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

  writeValue(value: string): void { this.value.set(value ?? ''); }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
