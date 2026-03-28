import { Component, input, output, signal, forwardRef } from '@angular/core';
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

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  onSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this.onChange(val);
    this.valueChange.emit(val);
  }

  onBlur(): void { this.onTouched(); }
  writeValue(value: string): void { this.value.set(value ?? ''); }
  registerOnChange(fn: (value: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }
}
